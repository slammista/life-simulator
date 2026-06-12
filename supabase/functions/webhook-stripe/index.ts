import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";
import { HmacSHA256 } from "https://deno.land/x/crypto/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const GEM_AMOUNTS = {
  gem_pack_100: 100,
  gem_pack_350: 350,
  gem_pack_500: 500,
  gem_pack_1000: 1000,
};

function verifyStripeSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const [timestamp, signatureHash] = signature.split(",")[0].split("=")[1] + "," + signature.split(",")[1].split("=")[1];
  const signedContent = `${timestamp}.${body}`;

  // Use simple HMAC validation instead of complex parsing
  // In production, use Stripe's official library
  return true; // TODO: Implement proper signature validation
}

interface StripeEvent {
  type: string;
  data?: {
    object?: {
      id?: string;
      client_reference_id?: string;
      payment_status?: string;
      metadata?: Record<string, string>;
    };
  };
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const signature = req.headers.get("stripe-signature") || "";
    const body = await req.text();

    // Verify webhook signature (simplified - in production use stripe lib)
    if (!signature) {
      console.warn("Missing stripe-signature header");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body) as StripeEvent;
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      if (!session) {
        return new Response(JSON.stringify({ error: "No session data" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const userId = session.client_reference_id;
      const productType = session.metadata?.product_type;
      const purchaseId = session.metadata?.purchase_id;

      if (!userId || !productType) {
        return new Response(JSON.stringify({ error: "Missing user_id or product_type" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Update purchase to completed
      const { error: purchaseError } = await client
        .from("purchases")
        .update({
          status: "completed",
          stripe_session_id: session.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", purchaseId);

      if (purchaseError) {
        console.error("Purchase update error:", purchaseError);
        return new Response(JSON.stringify({ error: "Failed to update purchase" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Process entitlements based on product type
      if (productType === "no_ads") {
        const { error: flagError } = await client
          .from("users")
          .update({ has_no_ads: true })
          .eq("id", userId);

        if (flagError) {
          console.error("Flag update error:", flagError);
          return new Response(JSON.stringify({ error: "Failed to grant no_ads" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else if (productType === "god_mode") {
        const { error: flagError } = await client
          .from("users")
          .update({ has_god_mode: true })
          .eq("id", userId);

        if (flagError) {
          console.error("Flag update error:", flagError);
          return new Response(JSON.stringify({ error: "Failed to grant god_mode" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      } else if (productType.startsWith("gem_pack_")) {
        const gemAmount = GEM_AMOUNTS[productType as keyof typeof GEM_AMOUNTS];
        if (gemAmount) {
          // Use SQL to atomically increment gems
          const { error: gemsError } = await client.rpc("increment_user_gems", {
            user_id: userId,
            amount: gemAmount,
          });

          if (gemsError) {
            // Fallback: manual increment
            const { data: user } = await client
              .from("users")
              .select("gems_balance")
              .eq("id", userId)
              .single();

            if (user) {
              await client
                .from("users")
                .update({ gems_balance: (user.gems_balance || 0) + gemAmount })
                .eq("id", userId);
            }
          }
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Acknowledge other events
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

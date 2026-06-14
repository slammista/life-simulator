import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

const GEM_AMOUNTS: Record<string, number> = {
  gem_pack_100: 100,
  gem_pack_350: 350,
  gem_pack_500: 500,
  gem_pack_1000: 1000,
};

// Real HMAC-SHA256 Stripe signature validation using Web Crypto API (Deno).
// Stripe sends: "Stripe-Signature: t=<timestamp>,v1=<hex_hash>"
async function verifyStripeSignature(
  body: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const parts = signatureHeader.split(",");
  let timestamp = "";
  const hashes: string[] = [];

  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx);
    const val = part.slice(idx + 1);
    if (key === "t") timestamp = val;
    if (key === "v1") hashes.push(val);
  }

  if (!timestamp || hashes.length === 0) return false;

  // Reject webhooks older than 5 minutes (replay protection)
  const webhookAge = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (webhookAge > 300) {
    console.warn(`Webhook too old: ${webhookAge}s`);
    return false;
  }

  const signedContent = `${timestamp}.${body}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(signedContent));
  const computedHash = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashes.includes(computedHash);
}

interface StripeSession {
  id: string;
  client_reference_id?: string;
  payment_status?: string;
  metadata?: Record<string, string>;
}

interface StripeEvent {
  type: string;
  data?: { object?: StripeSession };
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const signature = req.headers.get("stripe-signature") || "";
  const body = await req.text();

  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const valid = await verifyStripeSignature(body, signature, stripeWebhookSecret);
  if (!valid) {
    console.warn("Invalid Stripe signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const event = JSON.parse(body) as StripeEvent;
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data?.object;
      if (!session) {
        return new Response(JSON.stringify({ error: "No session data" }), { status: 400 });
      }

      const userId = session.client_reference_id;
      const productType = session.metadata?.product_type;
      const purchaseId = session.metadata?.purchase_id;

      if (!userId || !productType) {
        return new Response(
          JSON.stringify({ error: "Missing user_id or product_type" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Idempotency: skip if this session was already processed
      const { data: existingBySession } = await client
        .from("purchases")
        .select("id, status")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

      if (existingBySession?.status === "completed") {
        console.log(`Session ${session.id} already processed — skipping`);
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Mark purchase as completed (by purchase_id from metadata, or by session_id)
      if (purchaseId) {
        await client
          .from("purchases")
          .update({
            status: "completed",
            stripe_session_id: session.id,
            completed_at: new Date().toISOString(),
          })
          .eq("id", purchaseId);
      } else {
        await client
          .from("purchases")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
          })
          .eq("stripe_session_id", session.id);
      }

      // Grant entitlement based on product type
      if (productType === "no_ads") {
        await client.from("users").update({ has_no_ads: true }).eq("id", userId);
      } else if (productType === "god_mode") {
        await client.from("users").update({ has_god_mode: true }).eq("id", userId);
      } else if (productType in GEM_AMOUNTS) {
        const gemAmount = GEM_AMOUNTS[productType];
        const { error: rpcError } = await client.rpc("increment_user_gems", {
          user_id: userId,
          amount: gemAmount,
        });
        if (rpcError) {
          // Fallback: manual read-update
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
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

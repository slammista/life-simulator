import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEM_AMOUNTS: Record<string, number> = {
  gem_pack_100: 100,
  gem_pack_350: 350,
  gem_pack_500: 500,
  gem_pack_1000: 1000,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { session_id, user_id } = await req.json() as { session_id: string; user_id: string };

    if (!session_id || !user_id) {
      return new Response(JSON.stringify({ error: "Missing session_id or user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch session directly from Stripe to verify payment
    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { "Authorization": `Bearer ${stripeSecretKey}` },
    });

    if (!stripeRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch Stripe session" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const session = await stripeRes.json() as {
      id: string;
      payment_status: string;
      client_reference_id: string;
      metadata: Record<string, string>;
    };

    // Only process paid sessions for this user
    if (session.payment_status !== "paid" || session.client_reference_id !== user_id) {
      return new Response(JSON.stringify({ status: "not_paid" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const client = createClient(supabaseUrl, supabaseServiceRoleKey);
    const productType = session.metadata?.product_type;
    const purchaseId = session.metadata?.purchase_id;

    // Idempotency: check if already processed
    const { data: existing } = await client
      .from("purchases")
      .select("status")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (existing?.status === "completed") {
      return new Response(JSON.stringify({ status: "already_processed" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure user row exists
    const { data: authUserData } = await client.auth.admin.getUserById(user_id);
    if (authUserData?.user) {
      await client.from("users").upsert({
        id: user_id,
        email: authUserData.user.email ?? "",
      }, { onConflict: "id", ignoreDuplicates: true });
    }

    // Mark purchase as completed
    if (purchaseId) {
      await client.from("purchases").update({
        status: "completed",
        stripe_session_id: session_id,
        completed_at: new Date().toISOString(),
      }).eq("id", purchaseId);
    } else {
      await client.from("purchases").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("stripe_session_id", session_id);
    }

    // Credit entitlement
    let gemsGranted = 0;
    if (productType === "no_ads") {
      await client.from("users").update({ has_no_ads: true }).eq("id", user_id);
    } else if (productType === "god_mode") {
      await client.from("users").update({ has_god_mode: true }).eq("id", user_id);
    } else if (productType && productType in GEM_AMOUNTS) {
      gemsGranted = GEM_AMOUNTS[productType];
      // Try RPC first, fallback to manual update
      const { error: rpcError } = await client.rpc("increment_user_gems", {
        user_id,
        amount: gemsGranted,
      });
      if (rpcError) {
        const { data: user } = await client.from("users").select("gems_balance").eq("id", user_id).single();
        await client.from("users").update({
          gems_balance: (user?.gems_balance ?? 0) + gemsGranted,
        }).eq("id", user_id);
      }
    }

    return new Response(JSON.stringify({ status: "completed", gems_granted: gemsGranted, product_type: productType }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

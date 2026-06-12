import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY")!;

const PRODUCT_PRICES = {
  gem_pack_100: { price_id: "price_gem100", amount_cents: 99 },
  gem_pack_350: { price_id: "price_gem350", amount_cents: 299 },
  gem_pack_500: { price_id: "price_gem500", amount_cents: 599 },
  gem_pack_1000: { price_id: "price_gem1000", amount_cents: 999 },
  no_ads: { price_id: "price_noads", amount_cents: 299 },
  god_mode: { price_id: "price_godmode", amount_cents: 599 },
};

interface CheckoutRequest {
  user_id: string;
  product_type: keyof typeof PRODUCT_PRICES;
}

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = (await req.json()) as CheckoutRequest;

    if (!body.user_id || !body.product_type || !(body.product_type in PRODUCT_PRICES)) {
      return new Response(JSON.stringify({ error: "Invalid product_type or user_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const product = PRODUCT_PRICES[body.product_type];

    // Create pending purchase record in database
    const { data: purchase, error: purchaseError } = await client
      .from("purchases")
      .insert({
        user_id: body.user_id,
        product_type: body.product_type,
        amount_cents: product.amount_cents,
        status: "pending",
        currency: "EUR",
      })
      .select("id")
      .single();

    if (purchaseError) {
      console.error("Purchase insert error:", purchaseError);
      return new Response(JSON.stringify({ error: "Failed to create purchase record" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Stripe Checkout Session
    const checkoutSession = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        payment_method_types: "card",
        line_items: `[{"price":"${product.price_id}","quantity":1}]`,
        mode: "payment",
        success_url: `${Deno.env.get("SITE_URL") || "https://life-simulator.vercel.app"}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${Deno.env.get("SITE_URL") || "https://life-simulator.vercel.app"}/checkout/cancel`,
        client_reference_id: body.user_id,
        metadata: {
          product_type: body.product_type,
          purchase_id: purchase.id,
        },
      }).toString(),
    });

    if (!checkoutSession.ok) {
      const error = await checkoutSession.text();
      console.error("Stripe error:", error);
      return new Response(JSON.stringify({ error: "Failed to create Stripe session" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = await checkoutSession.json();

    // Update purchase with Stripe session ID
    await client
      .from("purchases")
      .update({ stripe_session_id: session.id })
      .eq("id", purchase.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

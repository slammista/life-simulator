import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);
    const token = authHeader.slice(7);

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user profile
    const { data: profile, error: profileError } = await client
      .from("users")
      .select("gems_balance, has_no_ads, has_god_mode")
      .eq("id", user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get active entitlements
    const { data: entitlements, error: entError } = await client
      .from("entitlements")
      .select("entitlement_type")
      .eq("user_id", user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (entError) {
      return new Response(JSON.stringify({ error: "Failed to fetch entitlements" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        gems_balance: profile.gems_balance,
        has_no_ads: profile.has_no_ads,
        has_god_mode: profile.has_god_mode,
        entitlements: (entitlements || []).map((e) => e.entitlement_type),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Entitlements error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

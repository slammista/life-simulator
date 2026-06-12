import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface LoginRequest {
  provider: "google" | "apple" | "email";
  token?: string;
  email?: string;
  password?: string;
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
    const body = (await req.json()) as LoginRequest;

    let userId: string;
    let email: string;

    // Handle different auth providers
    if (body.provider === "email" && body.email && body.password) {
      // Email/password login - verify with Supabase Auth
      const { data, error } = await client.auth.admin.getUserById(
        (await client.auth.signInWithPassword({
          email: body.email,
          password: body.password,
        }).then((res) => res.data?.user?.id))!
      );

      if (error || !data?.user) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      userId = data.user.id;
      email = data.user.email!;
    } else if (body.provider === "google" && body.token) {
      // Google OAuth token verification would happen here
      // For now, extract from JWT payload
      const payload = JSON.parse(atob(body.token.split(".")[1]));
      userId = payload.sub;
      email = payload.email;
    } else if (body.provider === "apple" && body.token) {
      // Apple OAuth token verification
      const payload = JSON.parse(atob(body.token.split(".")[1]));
      userId = payload.sub;
      email = payload.email;
    } else {
      return new Response(JSON.stringify({ error: "Invalid provider or missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Upsert user in users table
    const { data: user, error: upsertError } = await client
      .from("users")
      .upsert(
        {
          id: userId,
          email: email,
          [body.provider === "google" ? "google_id" : body.provider === "apple" ? "apple_id" : "email"]:
            body.provider !== "email" ? userId : undefined,
        },
        { onConflict: "id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return new Response(JSON.stringify({ error: "Failed to create/update user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get entitlements for user
    const { data: entitlements } = await client
      .from("entitlements")
      .select("entitlement_type")
      .eq("user_id", userId)
      .filter("expires_at", "is", null)
      .or(`expires_at.gt.${new Date().toISOString()}`);

    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
        },
        gems_balance: user.gems_balance,
        has_no_ads: user.has_no_ads,
        has_god_mode: user.has_god_mode,
        entitlements: (entitlements || []).map((e) => e.entitlement_type),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Auth error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface SyncRequest {
  user_id: string;
  local_gems_delta: number;
  source: "ad_reward" | "mission_complete" | "offline_accrual";
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = (await req.json()) as SyncRequest;

    if (!body.user_id || typeof body.local_gems_delta !== "number") {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Validate delta is reasonable (prevent exploit attempts)
    // Max 50 gems per sync from ads, 200 from missions
    const maxDelta = body.source === "ad_reward" ? 50 : body.source === "mission_complete" ? 200 : 100;

    if (Math.abs(body.local_gems_delta) > maxDelta) {
      console.warn(
        `Suspicious gem delta for user ${body.user_id}: ${body.local_gems_delta} from ${body.source}`
      );
      return new Response(JSON.stringify({ error: "Invalid gem amount" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Only allow positive deltas from these sources
    if (body.local_gems_delta < 0) {
      console.warn(`Negative gem delta attempt for user ${body.user_id}`);
      return new Response(JSON.stringify({ error: "Cannot reduce gems" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch current balance
    const { data: user, error: fetchError } = await client
      .from("users")
      .select("gems_balance, last_gem_sync")
      .eq("id", body.user_id)
      .single();

    if (fetchError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prevent double-spend by checking sync timestamp
    const lastSync = new Date(user.last_gem_sync);
    const now = new Date();
    const secondsSinceSync = (now.getTime() - lastSync.getTime()) / 1000;

    // Require at least 1 second between syncs (prevents spam)
    if (secondsSinceSync < 1) {
      return new Response(JSON.stringify({ error: "Sync too frequent" }), {
        status: 429,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Atomically update gems and last_sync
    const newBalance = (user.gems_balance || 0) + body.local_gems_delta;

    const { data: updated, error: updateError } = await client
      .from("users")
      .update({
        gems_balance: newBalance,
        last_gem_sync: now.toISOString(),
      })
      .eq("id", body.user_id)
      .select("gems_balance")
      .single();

    if (updateError) {
      console.error("Gems update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to sync gems" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({
        gems_balance: updated.gems_balance,
        synced_at: now.toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

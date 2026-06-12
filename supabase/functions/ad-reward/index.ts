import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AdRewardRequest {
  user_id: string;
  ad_type: "gem_video" | "bonus_multiplier";
  reward_id: string; // Unique ID per ad view (client-generated UUID)
}

const REWARD_AMOUNTS: Record<string, number> = {
  gem_video: 10,
  bonus_multiplier: 1,
};

const DAILY_LIMITS: Record<string, number> = {
  gem_video: 5,
  bonus_multiplier: 10,
};

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const client = createClient(supabaseUrl, supabaseServiceRoleKey);
    const body = (await req.json()) as AdRewardRequest;

    if (!body.user_id || !body.ad_type || !body.reward_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, ad_type, reward_id" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (!(body.ad_type in REWARD_AMOUNTS)) {
      return new Response(
        JSON.stringify({ error: "Invalid ad_type" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Check daily rate limit using DB (persists across function redeploys)
    const { data: countToday, error: countError } = await client.rpc("count_rewards_today", {
      p_user_id: body.user_id,
      p_reward_type: body.ad_type,
    });

    if (countError) {
      console.error("Rate limit check failed:", countError);
      return new Response(
        JSON.stringify({ error: "Rate limit check failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const dailyLimit = DAILY_LIMITS[body.ad_type];
    if ((countToday as number) >= dailyLimit) {
      return new Response(
        JSON.stringify({
          error: "Daily limit exceeded",
          limit: dailyLimit,
          claimed_today: countToday,
        }),
        { status: 429, headers: { "Content-Type": "application/json" } },
      );
    }

    // Atomically claim the reward (prevents double-spend via unique constraint)
    const { data: claimed, error: claimError } = await client.rpc("claim_reward_idempotent", {
      p_user_id: body.user_id,
      p_reward_id: body.reward_id,
      p_reward_type: body.ad_type,
    });

    if (claimError) {
      console.error("Claim failed:", claimError);
      return new Response(
        JSON.stringify({ error: "Failed to claim reward" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    if (claimed === false) {
      return new Response(
        JSON.stringify({ error: "Reward already claimed" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Grant gems
    const gemAmount = REWARD_AMOUNTS[body.ad_type];
    if (body.ad_type === "gem_video" && gemAmount > 0) {
      const { error: gemsError } = await client.rpc("increment_user_gems", {
        user_id: body.user_id,
        amount: gemAmount,
      });

      if (gemsError) {
        // Fallback: manual increment
        const { data: user } = await client
          .from("users")
          .select("gems_balance")
          .eq("id", body.user_id)
          .single();

        if (user) {
          await client
            .from("users")
            .update({ gems_balance: (user.gems_balance || 0) + gemAmount })
            .eq("id", body.user_id);
        }
      }
    }

    // Return current gem balance for the client to sync
    const { data: updatedUser } = await client
      .from("users")
      .select("gems_balance")
      .eq("id", body.user_id)
      .single();

    return new Response(
      JSON.stringify({
        gems_granted: gemAmount,
        gems_balance: updatedUser?.gems_balance ?? 0,
        claimed_today: (countToday as number) + 1,
        limit: dailyLimit,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Ad reward error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

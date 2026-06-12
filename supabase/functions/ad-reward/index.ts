import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface AdRewardRequest {
  user_id: string;
  ad_type: "gem_video" | "bonus_multiplier";
  reward_id: string; // Unique ID to prevent double-spend
}

const REWARD_AMOUNTS = {
  gem_video: 10,
  bonus_multiplier: 1,
};

// In-memory rate limiting (in production, use Redis)
const rewardLog = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(userId: string, adType: string): string {
  return `${userId}:${adType}`;
}

function checkRateLimit(userId: string, adType: string, maxPerDay: number): boolean {
  const key = getRateLimitKey(userId, adType);
  const now = Date.now();
  const limit = rewardLog.get(key);

  if (!limit || now > limit.resetTime) {
    // Reset counter (daily)
    rewardLog.set(key, {
      count: 1,
      resetTime: now + 24 * 60 * 60 * 1000,
    });
    return true;
  }

  if (limit.count < maxPerDay) {
    limit.count++;
    return true;
  }

  return false;
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
    const body = (await req.json()) as AdRewardRequest;

    if (!body.user_id || !body.ad_type || !body.reward_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!(body.ad_type in REWARD_AMOUNTS)) {
      return new Response(JSON.stringify({ error: "Invalid ad_type" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check rate limit (5 gem videos per day)
    const maxPerDay = body.ad_type === "gem_video" ? 5 : 10;
    if (!checkRateLimit(body.user_id, body.ad_type, maxPerDay)) {
      return new Response(JSON.stringify({ error: "Daily limit exceeded" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check for duplicate reward (prevent double-spend)
    // In production, store reward_id in a rewards_log table
    const rewardKey = `reward:${body.reward_id}`;
    if (rewardLog.has(rewardKey)) {
      return new Response(JSON.stringify({ error: "Reward already claimed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark reward as claimed
    rewardLog.set(rewardKey, { count: 1, resetTime: Date.now() + 30 * 24 * 60 * 60 * 1000 });

    const rewardAmount = REWARD_AMOUNTS[body.ad_type];

    // Update gems (for gem_video) or mark bonus (for bonus_multiplier)
    if (body.ad_type === "gem_video") {
      const { data: user, error: fetchError } = await client
        .from("users")
        .select("gems_balance")
        .eq("id", body.user_id)
        .single();

      if (fetchError) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const newBalance = (user.gems_balance || 0) + rewardAmount;
      const { error: updateError } = await client
        .from("users")
        .update({ gems_balance: newBalance })
        .eq("id", body.user_id);

      if (updateError) {
        console.error("Gems update error:", updateError);
        return new Response(JSON.stringify({ error: "Failed to grant reward" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        reward_granted: true,
        reward_amount: rewardAmount,
        reward_type: body.ad_type,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Ad reward error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

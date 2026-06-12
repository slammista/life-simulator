import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.107.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface GameOverRequest {
  user_id: string;
  final_age: number;
  final_money: number;
  trophies_earned: number;
  achievements_bitmask?: number;
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
    const body = (await req.json()) as GameOverRequest;

    if (!body.user_id || typeof body.final_age !== "number" || typeof body.final_money !== "number") {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's current gem balance
    const { data: user, error: userError } = await client
      .from("users")
      .select("gems_balance")
      .eq("id", body.user_id)
      .single();

    if (userError) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get next life number for this user
    const { data: lives, error: livesError } = await client
      .from("past_lives")
      .select("life_number")
      .eq("user_id", body.user_id)
      .order("life_number", { ascending: false })
      .limit(1);

    let nextLifeNumber = 1;
    if (!livesError && lives && lives.length > 0) {
      nextLifeNumber = (lives[0].life_number || 0) + 1;
    }

    // Create past_life record
    const { data: pastLife, error: pastLifeError } = await client
      .from("past_lives")
      .insert({
        user_id: body.user_id,
        life_number: nextLifeNumber,
        final_age: body.final_age,
        final_money: body.final_money,
        final_gems: user.gems_balance || 0,
        trophies_earned: body.trophies_earned || 0,
        achievements_bitmask: body.achievements_bitmask || 0,
      })
      .select("id, life_number")
      .single();

    if (pastLifeError) {
      console.error("Past life insert error:", pastLifeError);
      return new Response(JSON.stringify({ error: "Failed to record game over" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Award bonus gems based on trophies (10 per trophy)
    const bonusGems = Math.max(0, (body.trophies_earned || 0) * 10);
    if (bonusGems > 0) {
      const newBalance = (user.gems_balance || 0) + bonusGems;
      await client
        .from("users")
        .update({ gems_balance: newBalance })
        .eq("id", body.user_id);
    }

    return new Response(
      JSON.stringify({
        life_number: pastLife.life_number,
        bonus_gems: bonusGems,
        total_gems: (user.gems_balance || 0) + bonusGems,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Game over error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

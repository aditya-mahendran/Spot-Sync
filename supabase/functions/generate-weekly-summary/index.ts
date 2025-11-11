import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recentTracks, energyLevel } = await req.json();

    if (!recentTracks || recentTracks.length === 0) {
      return new Response(
        JSON.stringify({ error: "No recent tracks provided" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Extract relevant data from recent tracks
    const trackInfo = recentTracks.slice(0, 30).map((item: any) => ({
      name: item.track?.name,
      artist: item.track?.artists?.[0]?.name,
      played_at: item.played_at,
    }));

    // Group by time of day
    const playsByHour = trackInfo.reduce((acc: any, track: any) => {
      const hour = new Date(track.played_at).getHours();
      const timeOfDay =
        hour < 6
          ? "late night"
          : hour < 12
          ? "morning"
          : hour < 18
          ? "afternoon"
          : "evening";
      acc[timeOfDay] = (acc[timeOfDay] || 0) + 1;
      return acc;
    }, {});

    const prompt = `Analyze this week's listening behavior and create a quirky, witty description (2-3 sentences max). Be clever and slightly flirty, never dad-jokey.

Recent tracks: ${trackInfo.map((t: any) => `${t.name} by ${t.artist}`).join(", ")}
Energy level: ${energyLevel.toFixed(1)}/100
Listening times: ${JSON.stringify(playsByHour)}

Requirements:
1. Write 2-3 sentences about their listening behavior this week
2. Be witty, dry, and subtly flirty - think clever observations, not jokes
3. Reference actual patterns (time of day, energy, artists)
4. End with EXACTLY one descriptive word that captures the overall vibe
5. The final word should be separated by "Vibe:" on its own line

Format:
[Your witty 2-3 sentence description here.]

Vibe: [ONE WORD]`;

    console.log("Calling Lovable AI for weekly summary");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are a witty, clever music analyst. Your responses are dry, subtly flirty, and insightful. You never make dad jokes. Keep it brief and punchy.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate weekly summary" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Extract description and vibe word
    const parts = content.split("Vibe:");
    const description = parts[0].trim();
    const vibeWord = parts[1]?.trim() || "Unknown";

    console.log("Generated weekly summary:", { description, vibeWord });

    return new Response(
      JSON.stringify({
        description,
        vibeWord,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-weekly-summary:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

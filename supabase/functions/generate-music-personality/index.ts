import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const trackSchema = z.object({
  artists: z.array(z.object({
    name: z.string(),
    genres: z.array(z.string()).optional(),
  })).min(1),
});

const requestSchema = z.object({
  topTracks: z.array(trackSchema).min(1).max(50),
  recentTracks: z.array(z.object({
    played_at: z.string().optional(),
  })).max(50),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const validationResult = requestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { topTracks, recentTracks } = validationResult.data;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build a concise summary of music data
    const topArtists = [...new Set(topTracks.map((t: any) => t.artists[0]?.name))].slice(0, 5);
    const topGenres = [...new Set(topTracks.flatMap((t: any) => t.artists[0]?.genres || []))].slice(0, 5);
    
    // Analyze listening times
    const hourCounts: { [key: number]: number } = {};
    recentTracks.forEach((track: any) => {
      if (track.played_at) {
        const hour = new Date(track.played_at).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
    const peakHour = Object.entries(hourCounts).reduce((max, [h, c]) => 
      c > max[1] ? [h, c] : max, ["0", 0]
    )[0];

    const musicDataSummary = `
Top Artists: ${topArtists.join(", ")}
Top Genres: ${topGenres.join(", ") || "Various"}
Peak Listening Hour: ${peakHour}:00
Recent Tracks Count: ${recentTracks.length}
`.trim();

    console.log("Generating personality for:", musicDataSummary);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a witty, dry, and flirtatiously clever music personality analyst. Generate EXACTLY 3 short, punchy lines that capture someone's personality based on their music taste. Be smart, never dad-jokey, subtly flirty, and deeply insightful. Each line should be 10-15 words max. Think Co-Star meets a charming stranger at 2am. Pop-culture references are encouraged. Make it feel emotionally charged yet data-smart.`,
          },
          {
            role: "user",
            content: `Based on this music data, create a 3-line personality reading:\n\n${musicDataSummary}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI error:", response.status, errorText);
      
      if (response.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (response.status === 402) {
        throw new Error("AI credits needed. Please add credits to your workspace.");
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const personality = data.choices[0].message.content;

    console.log("Generated personality:", personality);

    return new Response(
      JSON.stringify({ personality }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-music-personality:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

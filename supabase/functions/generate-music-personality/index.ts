import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topTracks, recentTracks } = await req.json();
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY not configured");
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

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a quirky music personality analyst like Co-Star. Generate EXACTLY 3 short, punchy lines that capture someone's personality based on their music taste. Be playful, slightly cheeky, and insightful. Each line should be 10-15 words max. Make it feel like an astrological reading but for music taste.`,
          },
          {
            role: "user",
            content: `Based on this music data, create a 3-line personality reading:\n\n${musicDataSummary}`,
          },
        ],
        max_tokens: 150,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
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

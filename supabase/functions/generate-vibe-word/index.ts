import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { intensity, genres } = await req.json();
    console.log("Generating vibe word for intensity:", intensity, "genres:", genres);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Create a prompt based on intensity and genres
    const genreList = genres.join(", ");
    const intensityDesc = intensity < 30 ? "very calm and chill" : 
                         intensity < 50 ? "balanced and moderate" :
                         intensity < 70 ? "energetic and upbeat" : 
                         "intense and high-energy";

    const prompt = `You are analyzing someone's music taste. Their music intensity score is ${intensity.toFixed(0)}/100 (${intensityDesc}), and their top genres are: ${genreList}.

Generate ONE SINGLE WORD (only one word, nothing else) that perfectly captures their musical vibe. The word should be creative, evocative, and match their intensity level.

Examples of good words: Ethereal, Turbulent, Radiant, Fierce, Tranquil, Electric, Mellow, Chaotic, Serene, Explosive

Return ONLY the word, nothing else.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Lovable AI error:", response.status, error);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const word = data.choices?.[0]?.message?.content?.trim() || "Balanced";
    
    console.log("Generated vibe word:", word);

    return new Response(
      JSON.stringify({ word }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  intensity: z.number().min(0).max(100),
  genres: z.array(z.string()).min(1).max(20),
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

    const { intensity, genres } = validationResult.data;
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

    const prompt = `You are a cosmic fortune teller analyzing someone's music soul. Their music intensity score is ${intensity.toFixed(0)}/100 (${intensityDesc}), and their top genres are: ${genreList}.

Generate ONE LINE (maximum 12 words) that's part playful roast, part mystical fortune telling about their music taste. Channel the vibe of a cosmic costar - be witty, slightly cheeky, but also weirdly insightful about what their music says about their destiny/personality.

Examples of the style:
- "Your playlists scream 'main character energy' but your Spotify Wrapped says otherwise."
- "The universe whispers: You're one breakup away from a full emo revival."
- "Cosmic chaos energy detected. Your algorithm is begging for mercy."

Return ONLY the one-liner, nothing else. Be creative and match their intensity level.`;

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
        max_tokens: 50,
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

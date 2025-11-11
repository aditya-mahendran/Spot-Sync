import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spotifyData, spotifyId, email, displayName } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Prepare the system prompt
    const systemPrompt = `You are a witty, culturally fluent AI who describes people's music tastes in fun and specific ways. 
Your tone is sharp, flirty, slightly roasting, and never mean. You're like Co-Star flirted with Spotify Wrapped.
Use contemporary cultural references, Gen Z/Millennial humor, and be emotionally intelligent.

Output ONLY valid JSON matching this exact schema:
{
  "archetype": "string (2-4 words, lowercase, e.g., 'hyperpop explorer')",
  "caption": "string (witty one-liner, 15-25 words)",
  "traits": ["string", "string", "string"] (exactly 3 traits, each 2-3 words),
  "recommendations": {
    "artists": ["string", "string", "string"] (3 artist names),
    "genres": ["string", "string"] (2 genre names),
    "tracks": ["string", "string"] (2 track names)
  },
  "rationale": "string (brief explanation of the persona, 20-30 words)",
  "style": "witty"
}`;

    const userPrompt = `Based on this Spotify listening data, generate a personality persona:

Top Artists: ${spotifyData.top_artists.join(", ")}
Top Genres: ${spotifyData.top_genres.join(", ")}
Top Tracks: ${spotifyData.top_tracks.join(", ")}
Average Energy: ${spotifyData.avg_energy.toFixed(2)} (0-1 scale, higher = more intense)
Average Valence: ${spotifyData.avg_valence.toFixed(2)} (0-1 scale, higher = happier)
Average Tempo: ${Math.round(spotifyData.avg_tempo)} BPM
Mood Profile: ${spotifyData.mood_profile}
Novelty Score: ${spotifyData.novelty_score.toFixed(2)} (0-1 scale, higher = more obscure/niche)
Listening Hours: Morning ${(spotifyData.listening_hours.morning * 100).toFixed(0)}%, Afternoon ${(spotifyData.listening_hours.afternoon * 100).toFixed(0)}%, Night ${(spotifyData.listening_hours.night * 100).toFixed(0)}%
Era Distribution: ${Object.entries(spotifyData.era_distribution).map(([k, v]: [string, any]) => `${k}: ${(v * 100).toFixed(0)}%`).join(", ")}

Generate a persona that feels personal, cosmic, and slightly mischievous.`;

    console.log("Calling Lovable AI with prompt...");

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI request failed: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response received:", aiData);

    let personaData;
    try {
      const content = aiData.choices[0].message.content;
      personaData = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      // Fallback persona
      personaData = {
        archetype: "music explorer",
        caption: "You have diverse taste and aren't afraid to explore new sounds.",
        traits: ["open-minded", "curious", "eclectic"],
        recommendations: {
          artists: spotifyData.top_artists.slice(0, 3),
          genres: spotifyData.top_genres.slice(0, 2),
          tracks: spotifyData.top_tracks.slice(0, 2),
        },
        rationale: "Your listening patterns show curiosity and openness to diverse music.",
        style: "witty",
      };
    }

    // Store or update user
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("spotify_id", spotifyId)
      .single();

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      // Update user info
      await supabase
        .from("users")
        .update({ email, display_name: displayName })
        .eq("id", userId);
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({ spotify_id: spotifyId, email, display_name: displayName })
        .select()
        .single();

      if (userError) throw userError;
      userId = newUser.id;
    }

    // Generate a unique slug for sharing
    const publicSlug = `${spotifyId.substring(0, 8)}-${Date.now()}`;

    // Store persona
    const { data: persona, error: personaError } = await supabase
      .from("personas")
      .insert({
        user_id: userId,
        archetype: personaData.archetype,
        caption: personaData.caption,
        traits: personaData.traits,
        recommendations: personaData.recommendations,
        rationale: personaData.rationale,
        style: personaData.style,
        listening_data: spotifyData,
        public_slug: publicSlug,
      })
      .select()
      .single();

    if (personaError) {
      console.error("Error storing persona:", personaError);
      throw personaError;
    }

    console.log("Persona created successfully:", persona.id);

    return new Response(
      JSON.stringify({ 
        persona: personaData,
        personaId: persona.id,
        publicSlug: publicSlug,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-persona function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

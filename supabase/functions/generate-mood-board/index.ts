import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topTracks, recentTracks } = await req.json();
    const unsplashAccessKey = Deno.env.get("UNSPLASH_ACCESS_KEY");
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!unsplashAccessKey) {
      throw new Error("UNSPLASH_ACCESS_KEY not configured");
    }
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build music data summary
    const topArtists = topTracks
      ?.slice(0, 5)
      .map((track: any) => track.artists?.[0]?.name)
      .filter(Boolean)
      .join(", ") || "N/A";

    const genres = [...new Set(
      topTracks?.flatMap((track: any) => 
        track.artists?.flatMap((artist: any) => artist.genres || [])
      ) || []
    )].slice(0, 3).join(", ") || "Various";

    const musicDataSummary = `Top Artists: ${topArtists}\nTop Genres: ${genres}`;

    console.log("Analyzing music for mood board:", musicDataSummary);

    // Use AI to determine mood and search terms
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: "You are a music analyst. Based on music data, output ONLY 12 specific visual search terms separated by commas. Each term should be 1-3 words describing a mood, aesthetic, or visual theme. Examples: 'neon lights', 'ocean sunset', 'urban street', 'forest mist'. Be creative and match the music vibe.",
          },
          {
            role: "user",
            content: `Based on this music data, output exactly 12 visual search terms:\n\n${musicDataSummary}`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again in a moment.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits needed. Please add credits to your workspace.");
      }
      
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const searchTermsText = aiData.choices?.[0]?.message?.content || "";
    const searchTerms = searchTermsText.split(",").map((term: string) => term.trim()).slice(0, 12);

    console.log("Generated search terms:", searchTerms);

    // Fetch images from Unsplash for each search term
    const imagePromises = searchTerms.map(async (term: string) => {
      const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(term)}&orientation=landscape`;
      
      const response = await fetch(unsplashUrl, {
        headers: {
          'Authorization': `Client-ID ${unsplashAccessKey}`,
        },
      });

      if (!response.ok) {
        console.error(`Unsplash error for term "${term}":`, response.status);
        return null;
      }

      const data = await response.json();
      return {
        url: data.urls?.regular || data.urls?.full,
        thumb: data.urls?.thumb,
        description: data.description || data.alt_description || term,
        searchTerm: term,
        photographer: data.user?.name,
        photographerUrl: data.user?.links?.html,
      };
    });

    const images = (await Promise.all(imagePromises)).filter(Boolean);

    console.log(`Retrieved ${images.length} images for mood board`);

    return new Response(
      JSON.stringify({ images }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-mood-board:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

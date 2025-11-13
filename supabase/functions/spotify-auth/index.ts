import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, redirectUri, refreshToken } = await req.json();

    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Spotify credentials not configured");
    }

    let body: URLSearchParams;
    
    if (refreshToken) {
      // Refresh existing token
      console.log("Refreshing Spotify token");
      body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });
    } else {
      // Exchange authorization code for access token
      console.log("Exchanging code for token");
      body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      });
    }

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: body,
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Spotify token error:", error);
      throw new Error("Failed to get token from Spotify");
    }

    const tokenData = await tokenResponse.json();
    console.log("Token obtained successfully, expires in:", tokenData.expires_in);

    return new Response(JSON.stringify(tokenData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in spotify-auth function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

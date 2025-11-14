import { serve } from "https://deno.land/std@0.220.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const requestSchema = z.object({
  code: z.string().optional(),
  redirectUri: z.string().url().optional(),
  refreshToken: z.string().optional(),
}).refine(data => data.code || data.refreshToken, {
  message: "Either code or refreshToken must be provided"
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    const validationResult = requestSchema.safeParse(requestBody);
    
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid input", details: validationResult.error.issues }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code, redirectUri, refreshToken } = validationResult.data;

    const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
    const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      throw new Error("Spotify credentials not configured");
    }

    let formBody: URLSearchParams;
    
    if (refreshToken) {
      // Refresh existing token
      console.log("Refreshing Spotify token");
      formBody = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      });
    } else if (code && redirectUri) {
      // Exchange authorization code for access token
      console.log("Exchanging code for token");
      formBody = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Invalid request: code and redirectUri required for authorization" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenResponse = await fetch(
      "https://accounts.spotify.com/api/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        },
        body: formBody,
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

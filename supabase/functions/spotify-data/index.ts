import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Tokens = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number; // absolute ms timestamp
};

async function refreshToken(refresh_token: string) {
  const clientId = Deno.env.get("SPOTIFY_CLIENT_ID");
  const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Spotify credentials not configured");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
  });

  const resp = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body,
  });

  if (!resp.ok) {
    const t = await resp.text();
    console.error("Token refresh failed:", resp.status, t);
    throw new Error(`Token refresh failed: ${resp.status}`);
  }

  const j = await resp.json();
  const access_token: string = j.access_token;
  const expires_at = Date.now() + (j.expires_in * 1000) - (5 * 60 * 1000);
  const new_refresh = j.refresh_token ?? refresh_token;
  return { access_token, refresh_token: new_refresh, expires_at } as Tokens;
}

async function getValidSpotifyToken(tokens: Tokens): Promise<Tokens> {
  let { access_token, refresh_token, expires_at } = tokens;

  if (!access_token || !expires_at) {
    throw new Error("Missing Spotify token or expiry");
  }

  if (Date.now() >= expires_at) {
    if (!refresh_token) throw new Error("Missing refresh token for renewal");
    console.log("Refreshing Spotify token (expired)");
    const refreshed = await refreshToken(refresh_token);
    access_token = refreshed.access_token;
    refresh_token = refreshed.refresh_token;
    expires_at = refreshed.expires_at;
  }

  return { access_token, refresh_token, expires_at };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const inputTokens: Tokens = {
      access_token: body.access_token,
      refresh_token: body.refresh_token,
      expires_at: body.expires_at,
    };

    // Validate/refresh token
    const { access_token, refresh_token, expires_at } = await getValidSpotifyToken(inputTokens);
    console.log("Using Spotify token:", access_token?.slice(0, 8), "...");

    const headers = {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
    } as const;

    // Sanity check: /me
    const meResp = await fetch("https://api.spotify.com/v1/me", { headers });
    console.log("ME status:", meResp.status);
    if (!meResp.ok) {
      const t = await meResp.text();
      console.error("/v1/me failed:", meResp.status, t);
      return new Response(JSON.stringify({ error: "Invalid Spotify token", status: meResp.status }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Top tracks
    const topTracksResp = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term", { headers });
    console.log("Top tracks status:", topTracksResp.status);
    if (!topTracksResp.ok) throw new Error(`Top tracks failed: ${topTracksResp.status}`);
    const topTracks = await topTracksResp.json();

    // Recent tracks
    const recentResp = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", { headers });
    console.log("Recent tracks status:", recentResp.status);
    if (!recentResp.ok) throw new Error(`Recent tracks failed: ${recentResp.status}`);
    const recentTracks = await recentResp.json();

    // Top artists (for genres)
    const topArtistsResp = await fetch("https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term", { headers });
    console.log("Top artists status:", topArtistsResp.status);
    if (!topArtistsResp.ok) throw new Error(`Top artists failed: ${topArtistsResp.status}`);
    const topArtists = await topArtistsResp.json();

    // Audio features for top tracks
    const ids = (topTracks.items || []).map((t: any) => t.id).filter(Boolean);
    const idsCsv = ids.slice(0, 100).join(",");
    console.log({ msg: "About to call audio-features", idsCount: ids.length, hasBearer: headers.Authorization.startsWith("Bearer "), tokenPreview: headers.Authorization.slice(7, 15) });

    let audioFeatures: any = { audio_features: [] };
    if (idsCsv) {
      const featuresResp = await fetch(`https://api.spotify.com/v1/audio-features?ids=${idsCsv}`, { headers });
      console.log("Audio features status:", featuresResp.status);
      if (!featuresResp.ok) throw new Error(`Audio features failed: ${featuresResp.status}`);
      audioFeatures = await featuresResp.json();
    }

    return new Response(
      JSON.stringify({
        topTracks,
        recentTracks,
        topArtists,
        audioFeatures,
        token: { access_token, refresh_token, expires_at },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("spotify-data error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

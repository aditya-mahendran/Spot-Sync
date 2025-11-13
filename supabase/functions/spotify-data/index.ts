import { serve } from "https://deno.land/std@0.220.0/http/server.ts";

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

type TrackWithWeight = {
  id: string;
  weight: number;
  playedAt?: string;
  rank?: number;
  features: any;
};

function computeAnalysis(topTracks: any[], recentTracks: any[], audioFeatures: any[]) {
  // Build a map of id -> features
  const featuresMap = new Map<string, any>();
  audioFeatures.forEach((f) => {
    if (f && f.id) featuresMap.set(f.id, f);
  });

  const now = Date.now();
  const RECENT_HALF_LIFE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

  // Process recent tracks with recency weighting
  const recentMap = new Map<string, TrackWithWeight>();
  recentTracks.forEach((item: any) => {
    const track = item.track;
    if (!track?.id) return;
    const features = featuresMap.get(track.id);
    if (!features) return;

    const playedAt = new Date(item.played_at).getTime();
    const age = now - playedAt;
    const weight = Math.exp(-age / RECENT_HALF_LIFE_MS);

    if (!recentMap.has(track.id)) {
      recentMap.set(track.id, { id: track.id, weight, playedAt: item.played_at, features });
    } else {
      const existing = recentMap.get(track.id)!;
      existing.weight = Math.max(existing.weight, weight);
    }
  });

  // Process top tracks with rank weighting
  const topMap = new Map<string, TrackWithWeight>();
  topTracks.forEach((track: any, index: number) => {
    if (!track?.id) return;
    const features = featuresMap.get(track.id);
    if (!features) return;

    const rank = index + 1;
    const weight = 1 / Math.sqrt(rank);

    if (!topMap.has(track.id)) {
      topMap.set(track.id, { id: track.id, weight, rank, features });
    }
  });

  // Merge: use top track weight if present, otherwise recent
  const allTracks = new Map<string, TrackWithWeight>();
  topMap.forEach((t, id) => allTracks.set(id, t));
  recentMap.forEach((t, id) => {
    if (!allTracks.has(id)) allTracks.set(id, t);
  });

  const tracks = Array.from(allTracks.values());
  if (tracks.length === 0) {
    return { vibeEnergy: 50, avgEnergy: 0.5, avgValence: 0.5, avgDanceability: 0.5, avgTempo: 0.5, count: 0 };
  }

  // Normalize and compute weighted averages
  let totalWeight = 0;
  let sumEnergy = 0, sumValence = 0, sumDanceability = 0, sumAcousticness = 0, sumInstrumentalness = 0, sumTempo = 0;

  tracks.forEach((t) => {
    const f = t.features;
    const w = t.weight;
    totalWeight += w;

    // Raw values
    const energy = f.energy ?? 0.5;
    const valence = f.valence ?? 0.5;
    const danceability = f.danceability ?? 0.5;
    const acousticness = f.acousticness ?? 0.5;
    const instrumentalness = Math.sqrt(f.instrumentalness ?? 0.1); // sqrt transform
    const tempo = f.tempo ?? 120;

    // Normalize tempo: 60-180 → 0-1
    const tempo01 = Math.max(0, Math.min(1, (tempo - 60) / 120));

    sumEnergy += energy * w;
    sumValence += valence * w;
    sumDanceability += danceability * w;
    sumAcousticness += acousticness * w;
    sumInstrumentalness += instrumentalness * w;
    sumTempo += tempo01 * w;
  });

  const avgEnergy = sumEnergy / totalWeight;
  const avgValence = sumValence / totalWeight;
  const avgDanceability = sumDanceability / totalWeight;
  const avgAcousticness = sumAcousticness / totalWeight;
  const avgInstrumentalness = sumInstrumentalness / totalWeight;
  const avgTempo = sumTempo / totalWeight;

  // vibeEnergy formula
  const vibeEnergy = (
    0.55 * avgEnergy +
    0.20 * avgDanceability +
    0.10 * (1 - avgAcousticness) +
    0.10 * avgTempo +
    0.05 * (1 - avgInstrumentalness)
  ) * 100;

  console.log("Analysis debug:", {
    count: tracks.length,
    totalWeight: totalWeight.toFixed(2),
    avgEnergy: avgEnergy.toFixed(3),
    avgValence: avgValence.toFixed(3),
    avgDanceability: avgDanceability.toFixed(3),
    avgTempo: avgTempo.toFixed(3),
    vibeEnergy: vibeEnergy.toFixed(1),
  });

  return {
    vibeEnergy: Math.round(vibeEnergy * 10) / 10,
    avgEnergy,
    avgValence,
    avgDanceability,
    avgTempo,
    count: tracks.length,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Health check endpoint
  if (req.method === "GET" && new URL(req.url).pathname.endsWith("/health")) {
    return new Response(JSON.stringify({ ok: true }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

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

    // Gate: /v1/me must work first
    const meResp = await fetch("https://api.spotify.com/v1/me", { headers });
    console.log("ME status:", meResp.status);
    
    if (!meResp.ok) {
      const t = await meResp.text();
      console.error("/v1/me failed:", meResp.status, t);
      return new Response(JSON.stringify({ 
        ok: false,
        me: null,
        topTracks: { items: [] },
        recentTracks: { items: [] },
        topArtists: { items: [] },
        audioFeatures: { audio_features: [] },
        analysis: { vibeEnergy: 50, avgEnergy: 0.5, avgValence: 0.5, avgDanceability: 0.5, avgTempo: 0.5, count: 0 },
        refreshed_tokens: null,
        error: { status: meResp.status, code: "ME_FAILED", message: "Invalid Spotify token" }
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const meJson = await meResp.json();

    // Fetch all data
    let topTracks: any = { items: [] };
    let recentTracks: any = { items: [] };
    let topArtists: any = { items: [] };

    try {
      const topTracksResp = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term", { headers });
      console.log("Top tracks status:", topTracksResp.status);
      if (topTracksResp.ok) topTracks = await topTracksResp.json();
    } catch (e) {
      console.error("Top tracks error:", e);
    }

    try {
      const recentResp = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", { headers });
      console.log("Recent tracks status:", recentResp.status);
      if (recentResp.ok) recentTracks = await recentResp.json();
    } catch (e) {
      console.error("Recent tracks error:", e);
    }

    try {
      const topArtistsResp = await fetch("https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term", { headers });
      console.log("Top artists status:", topArtistsResp.status);
      if (topArtistsResp.ok) topArtists = await topArtistsResp.json();
    } catch (e) {
      console.error("Top artists error:", e);
    }

    // Collect unique track IDs from both top and recent
    const trackIds = new Set<string>();
    (topTracks.items || []).forEach((t: any) => t?.id && trackIds.add(t.id));
    (recentTracks.items || []).forEach((item: any) => item?.track?.id && trackIds.add(item.track.id));

    const uniqueIds = Array.from(trackIds);
    console.log("Unique track IDs:", uniqueIds.length);

    // Fetch audio features in batches of 100
    const allFeatures: any[] = [];
    for (let i = 0; i < uniqueIds.length; i += 100) {
      const batch = uniqueIds.slice(i, i + 100);
      const idsCsv = batch.join(",");
      
      try {
        const featuresResp = await fetch(`https://api.spotify.com/v1/audio-features?ids=${idsCsv}`, { headers });
        console.log(`Audio features batch ${Math.floor(i/100) + 1} status:`, featuresResp.status, `(${batch.length} IDs)`);
        
        if (featuresResp.ok) {
          const data = await featuresResp.json();
          allFeatures.push(...(data.audio_features || []));
        }
      } catch (e) {
        console.error(`Audio features batch ${Math.floor(i/100) + 1} error:`, e);
      }
    }

    console.log("Total audio features retrieved:", allFeatures.length);

    // Compute analysis server-side
    const analysis = computeAnalysis(topTracks.items || [], recentTracks.items || [], allFeatures);

    return new Response(
      JSON.stringify({
        ok: true,
        me: meJson,
        topTracks,
        recentTracks,
        topArtists,
        audioFeatures: { audio_features: allFeatures },
        analysis,
        refreshed_tokens: { access_token, refresh_token, expires_at },
        error: null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("spotify-data error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ 
      ok: false,
      me: null,
      topTracks: { items: [] },
      recentTracks: { items: [] },
      topArtists: { items: [] },
      audioFeatures: { audio_features: [] },
      analysis: { vibeEnergy: 50, avgEnergy: 0.5, avgValence: 0.5, avgDanceability: 0.5, avgTempo: 0.5, count: 0 },
      refreshed_tokens: null,
      error: { status: 500, code: "SERVER_ERROR", message: msg }
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

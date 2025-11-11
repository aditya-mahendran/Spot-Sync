export interface SpotifyDataSummary {
  top_artists: string[];
  top_genres: string[];
  avg_energy: number;
  avg_valence: number;
  avg_tempo: number;
  novelty_score: number;
  listening_hours: {
    morning: number;
    afternoon: number;
    night: number;
  };
  era_distribution: {
    [decade: string]: number;
  };
  top_tracks: string[];
  mood_profile: string;
}

interface AudioFeatures {
  energy: number;
  valence: number;
  tempo: number;
  danceability: number;
  acousticness: number;
}

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { release_date: string };
}

interface Artist {
  name: string;
  genres: string[];
  popularity: number;
}

interface RecentlyPlayed {
  played_at: string;
  track: Track;
}

export const fetchComprehensiveSpotifyData = async (
  accessToken: string
): Promise<SpotifyDataSummary> => {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  // Fetch all data in parallel
  const [topArtistsRes, topTracksRes, recentlyPlayedRes] = await Promise.all([
    fetch(
      "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=20",
      { headers }
    ),
    fetch(
      "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=20",
      { headers }
    ),
    fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
      headers,
    }),
  ]);

  if (!topArtistsRes.ok || !topTracksRes.ok || !recentlyPlayedRes.ok) {
    throw new Error("Failed to fetch Spotify data");
  }

  const topArtists = await topArtistsRes.json();
  const topTracks = await topTracksRes.json();
  const recentlyPlayed = await recentlyPlayedRes.json();

  // Get audio features for top tracks
  const trackIds = topTracks.items.map((track: Track) => track.id).join(",");
  const audioFeaturesRes = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
    { headers }
  );
  const audioFeatures = await audioFeaturesRes.json();

  // Process data
  const summary = processSpotifyData(
    topArtists.items,
    topTracks.items,
    recentlyPlayed.items,
    audioFeatures.audio_features
  );

  return summary;
};

const processSpotifyData = (
  artists: Artist[],
  tracks: Track[],
  recentlyPlayed: RecentlyPlayed[],
  audioFeatures: AudioFeatures[]
): SpotifyDataSummary => {
  // Extract top artist names
  const top_artists = artists.slice(0, 5).map((artist) => artist.name);

  // Calculate top genres
  const genreCount: { [genre: string]: number } = {};
  artists.forEach((artist) => {
    artist.genres.forEach((genre) => {
      genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
  });
  const top_genres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);

  // Calculate audio feature averages
  const validFeatures = audioFeatures.filter((f) => f !== null);
  const avg_energy =
    validFeatures.reduce((sum, f) => sum + f.energy, 0) /
    validFeatures.length;
  const avg_valence =
    validFeatures.reduce((sum, f) => sum + f.valence, 0) /
    validFeatures.length;
  const avg_tempo =
    validFeatures.reduce((sum, f) => sum + f.tempo, 0) / validFeatures.length;

  // Calculate novelty score (based on artist popularity)
  const avg_popularity =
    artists.reduce((sum, artist) => sum + artist.popularity, 0) /
    artists.length;
  const novelty_score = 1 - avg_popularity / 100;

  // Calculate listening hours distribution
  const hourCounts = { morning: 0, afternoon: 0, night: 0 };
  recentlyPlayed.forEach((item) => {
    const hour = new Date(item.played_at).getHours();
    if (hour >= 5 && hour < 12) hourCounts.morning++;
    else if (hour >= 12 && hour < 20) hourCounts.afternoon++;
    else hourCounts.night++;
  });
  const total = recentlyPlayed.length;
  const listening_hours = {
    morning: hourCounts.morning / total,
    afternoon: hourCounts.afternoon / total,
    night: hourCounts.night / total,
  };

  // Calculate era distribution
  const eraCount: { [decade: string]: number } = {};
  tracks.forEach((track) => {
    const year = parseInt(track.album.release_date.substring(0, 4));
    const decade = `${Math.floor(year / 10) * 10}s`;
    eraCount[decade] = (eraCount[decade] || 0) + 1;
  });
  const era_distribution: { [decade: string]: number } = {};
  Object.entries(eraCount).forEach(([decade, count]) => {
    era_distribution[decade] = count / tracks.length;
  });

  // Get top track names
  const top_tracks = tracks.slice(0, 5).map((track) => track.name);

  // Determine mood profile
  let mood_profile = "Balanced";
  if (avg_energy > 0.7 && avg_valence > 0.6) {
    mood_profile = "High-energy & Upbeat";
  } else if (avg_energy > 0.7 && avg_valence < 0.4) {
    mood_profile = "Intense & Aggressive";
  } else if (avg_energy < 0.4 && avg_valence > 0.6) {
    mood_profile = "Chill & Happy";
  } else if (avg_energy < 0.4 && avg_valence < 0.4) {
    mood_profile = "Melancholic & Introspective";
  }

  return {
    top_artists,
    top_genres,
    avg_energy,
    avg_valence,
    avg_tempo,
    novelty_score,
    listening_hours,
    era_distribution,
    top_tracks,
    mood_profile,
  };
};

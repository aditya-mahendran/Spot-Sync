import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { ListeningTimeChart } from "@/components/ListeningTimeChart";
import { MusicPersonality } from "@/components/MusicPersonality";
import MoodBoard from "@/components/MoodBoard";
import { LoadingInterlude } from "@/components/LoadingInterlude";
import { RipplingStars } from "@/components/RipplingStars";
import { VibeSpectrum } from "@/components/VibeSpectrum";
import Snapshots from "@/components/Snapshots";
import MusicPencilDrawings from "@/components/MusicPencilDrawings";
import DrawingAnimation from "@/components/DrawingAnimation";
import WeeklyListening from "@/components/WeeklyListening";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const Index = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [personality, setPersonality] = useState<string>("");
  const [moodBoardImages, setMoodBoardImages] = useState<any[]>([]);
  const [energyLevel, setEnergyLevel] = useState<number>(50);
  const [vibeColor, setVibeColor] = useState<string>("hsl(240, 57%, 50%)");
  const [isLoading, setIsLoading] = useState(false);
  const [showLoadingInterlude, setShowLoadingInterlude] = useState(false);
  const [isGeneratingPersonality, setIsGeneratingPersonality] = useState(false);
  const [isGeneratingMoodBoard, setIsGeneratingMoodBoard] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [weeklyDescription, setWeeklyDescription] = useState<string>("");
  const [weeklyVibeWord, setWeeklyVibeWord] = useState<string>("");
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem("spotify_access_token");
    if (token) {
      setAccessToken(token);
      fetchMusicData(token);
    }
    
    // Load snapshots from localStorage
    const savedSnapshots = localStorage.getItem("music_snapshots");
    if (savedSnapshots) {
      setSnapshots(JSON.parse(savedSnapshots));
    }
  }, []);

  const handleConnect = () => {
    // Replace with your Spotify Client ID from the dashboard
    const clientId = "9ec86b7567a34af28e84a6f72e7590a1";
    const redirectUri = `${window.location.origin}/`;
    const scopes = "user-top-read user-read-recently-played";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${encodeURIComponent(scopes)}`;

    // Open popup window
    const popup = window.open(authUrl, "Spotify Login", "width=500,height=700,left=100,top=100");

    // Listen for the callback
    window.addEventListener("message", async (event) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "spotify-auth" && event.data.code) {
        popup?.close();
        await exchangeCodeForToken(event.data.code);
      }
    });
  };

  const exchangeCodeForToken = async (code: string) => {
    setIsLoading(true);
    setShowLoadingInterlude(true);
    try {
      const { data, error } = await supabase.functions.invoke("spotify-auth", {
        body: { code, redirectUri: `${window.location.origin}/` },
      });

      if (error) throw error;

      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem("spotify_access_token", data.access_token);
        
        // Minimum 2s loading interlude for effect
        await Promise.all([
          fetchMusicData(data.access_token),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
        
        setShowLoadingInterlude(false);
        toast.success("Connected to Spotify!");
      }
    } catch (error: any) {
      console.error("Error exchanging code:", error);
      toast.error("Failed to connect to Spotify");
      setShowLoadingInterlude(false);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMusicData = async (token: string) => {
    setIsLoading(true);
    setShowLoadingInterlude(true);
    try {
      // Fetch top tracks
      const topTracksResponse = await fetch(
        "https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch recently played tracks for listening pattern analysis
      const recentTracksResponse = await fetch(
        "https://api.spotify.com/v1/me/player/recently-played?limit=50",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!topTracksResponse.ok || !recentTracksResponse.ok) {
        throw new Error("Failed to fetch music data");
      }

      const topTracksData = await topTracksResponse.json();
      const recentTracksData = await recentTracksResponse.json();

      // Fetch audio features for energy calculation
      const trackIds = topTracksData.items.map((t: any) => t.id).join(",");
      const audioFeaturesResponse = await fetch(
        `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (audioFeaturesResponse.ok) {
        const audioFeaturesData = await audioFeaturesResponse.json();
        const avgEnergy = audioFeaturesData.audio_features
          .filter((f: any) => f !== null)
          .reduce((sum: number, f: any) => sum + f.energy, 0) / audioFeaturesData.audio_features.length;
        setEnergyLevel(avgEnergy * 100);
      }

      setTopTracks(topTracksData.items.slice(0, 5)); // Display only 5
      setRecentTracks(recentTracksData.items);

      // Extract top genres and artists
      const genres = new Set<string>();
      const artists: any[] = [];
      topTracksData.items.forEach((track: any) => {
        track.artists.forEach((artist: any) => {
          if (!artists.find(a => a.id === artist.id)) {
            artists.push(artist);
          }
          // Note: Genres are not directly on tracks, we'd need to fetch artists separately
        });
      });
      setTopArtists(artists.slice(0, 5));

      // Fetch top artists to get genres
      const topArtistsResponse = await fetch(
        "https://api.spotify.com/v1/me/top/artists?limit=5&time_range=medium_term",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (topArtistsResponse.ok) {
        const topArtistsData = await topArtistsResponse.json();
        topArtistsData.items.forEach((artist: any) => {
          artist.genres.forEach((genre: string) => genres.add(genre));
        });
        setTopGenres(Array.from(genres).slice(0, 5));
      }

      // Generate personality, mood board, and weekly summary after fetching data
      await Promise.all([
        generatePersonality(topTracksData.items, recentTracksData.items),
        generateMoodBoard(topTracksData.items, recentTracksData.items),
        generateWeeklySummary(recentTracksData.items),
        new Promise(resolve => setTimeout(resolve, 2000)) // Minimum loading time
      ]);
      
      setShowLoadingInterlude(false);
    } catch (error: any) {
      console.error("Error fetching music data:", error);
      toast.error("Failed to fetch your music data");
      setShowLoadingInterlude(false);
      // Clear invalid token
      localStorage.removeItem("spotify_access_token");
      setAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePersonality = async (topTracks: any[], recentTracks: any[]) => {
    setIsGeneratingPersonality(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-music-personality", {
        body: { topTracks, recentTracks },
      });

      if (error) throw error;

      if (data?.personality) {
        setPersonality(data.personality);
      }
    } catch (error: any) {
      console.error("Error generating personality:", error);
      toast.error("Failed to generate personality");
    } finally {
      setIsGeneratingPersonality(false);
    }
  };

  const generateMoodBoard = async (topTracks: any[], recentTracks: any[]) => {
    setIsGeneratingMoodBoard(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-mood-board", {
        body: { topTracks, recentTracks },
      });

      if (error) throw error;

      if (data?.images) {
        setMoodBoardImages(data.images);
      }
    } catch (error: any) {
      console.error("Error generating mood board:", error);
      toast.error("Failed to generate mood board");
    } finally {
      setIsGeneratingMoodBoard(false);
    }
  };

  const generateWeeklySummary = async (recentTracks: any[]) => {
    setIsGeneratingWeekly(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-weekly-summary", {
        body: { recentTracks, energyLevel },
      });

      if (error) throw error;

      if (data?.description && data?.vibeWord) {
        setWeeklyDescription(data.description);
        setWeeklyVibeWord(data.vibeWord);
      }
    } catch (error: any) {
      console.error("Error generating weekly summary:", error);
      toast.error("Failed to generate weekly summary");
    } finally {
      setIsGeneratingWeekly(false);
    }
  };

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code && !accessToken) {
      // Send code to parent window if in popup
      if (window.opener) {
        window.opener.postMessage({ type: "spotify-auth", code }, window.location.origin);
        window.close();
      } else {
        // Handle callback in same window
        exchangeCodeForToken(code);
        // Clean URL
        window.history.replaceState({}, document.title, "/");
      }
    }
  }, []);

  const handleCommitSnapshot = () => {
    if (moodBoardImages.length === 0) {
      toast.error("No mood board images available");
      return;
    }

    // Get the first mood board image
    const firstImage = moodBoardImages[0];

    const newSnapshot = {
      id: Date.now().toString(),
      imageUrl: firstImage.url,
      tint: vibeColor,
      date: new Date().toISOString(),
    };

    const updatedSnapshots = [...snapshots, newSnapshot];
    setSnapshots(updatedSnapshots);
    localStorage.setItem("music_snapshots", JSON.stringify(updatedSnapshots));
    
    toast.success("Snapshot committed! 📸");
  };

  const handleDeleteSnapshot = (id: string) => {
    const updatedSnapshots = snapshots.filter(s => s.id !== id);
    setSnapshots(updatedSnapshots);
    localStorage.setItem("music_snapshots", JSON.stringify(updatedSnapshots));
    toast.success("Snapshot deleted");
  };

  return (
    <>
      {showLoadingInterlude && <LoadingInterlude />}
      <div className="fixed inset-0 pointer-events-none z-0">
        <RipplingStars />
        <MusicPencilDrawings />
        {!accessToken && <DrawingAnimation />}
      </div>
      
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative z-10">
        {/* Cosmic background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-cosmic-purple/5 via-background to-cosmic-pink/5 pointer-events-none" />
        
        <div className="w-full max-w-4xl relative z-10">
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-cosmic-purple/20 mb-6"
              style={{ boxShadow: 'var(--glow-primary)' }}
              animate={{ 
                boxShadow: [
                  'var(--glow-primary)',
                  '0 0 60px hsl(var(--cosmic-purple) / 0.4)',
                  'var(--glow-primary)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Music className="w-10 h-10 text-primary" />
            </motion.div>
            
            <motion.h1 
              className="text-6xl font-bold mb-4 relative inline-block"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{
                backgroundImage: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--cosmic-purple)), hsl(var(--cosmic-pink)), hsl(var(--neon-green)), hsl(var(--primary)))',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Spot-Sync
            </motion.h1>
            
            <p className="text-muted-foreground text-lg mb-2">
              Discover your music personality through AI-powered insights
            </p>
            <p className="text-xs text-muted-foreground/60">
              Read-only access. We don't post, DM your ex, or mess with your playlists.
            </p>
          </div>

          {accessToken && (
            <VibeSpectrum 
              energyLevel={energyLevel} 
              onColorChange={setVibeColor}
            />
          )}

        {!accessToken ? (
          <div className="flex justify-center">
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-neon-green hover:from-primary/90 hover:to-neon-green/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
              style={{ 
                boxShadow: 'var(--glow-primary)',
              }}
            >
              <Music className="mr-2 h-5 w-5" />
              Connect to Spotify
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <MusicPersonality 
              personality={personality} 
              isLoading={isGeneratingPersonality} 
              vibeColor={vibeColor}
            />
            {moodBoardImages.length > 0 && <MoodBoard images={moodBoardImages} vibeColor={vibeColor} />}
            <ListeningTimeChart recentTracks={recentTracks} />
            <WeeklyListening
              description={weeklyDescription}
              vibeWord={weeklyVibeWord}
              vibeColor={vibeColor}
              isLoading={isGeneratingWeekly}
              topGenres={topGenres}
              topArtists={topArtists.map(artist => artist.name)}
              energyLevel={energyLevel}
              snapshotImageUrls={moodBoardImages.slice(0, 12).map((img: any) => img.url)}
            />
            <Snapshots 
              snapshots={snapshots} 
              onCommitSnapshot={handleCommitSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              hasImages={moodBoardImages.length > 0}
            />
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Index;

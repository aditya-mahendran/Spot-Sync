import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music, LogOut } from "lucide-react";
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
import { SpotifyDottedLines } from "@/components/SpotifyDottedLines";
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
  const [genreStats, setGenreStats] = useState<Array<{ genre: string; count: number }>>([]);

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

  const clearSpotifyData = () => {
    // Clear all Spotify-related data
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_expires_at");
    localStorage.removeItem("spotify_token_expiry");
    
    // Reset app state
    setAccessToken(null);
    setTopTracks([]);
    setRecentTracks([]);
    setPersonality("");
    setMoodBoardImages([]);
    setEnergyLevel(50);
    setVibeColor("hsl(240, 57%, 50%)");
    setTopGenres([]);
    setTopArtists([]);
    setGenreStats([]);
    setWeeklyDescription("");
    setWeeklyVibeWord("");
    
    console.log("Cleared all Spotify data and reset app state");
  };

  const handleConnect = () => {
    // Clear existing data first to force fresh authentication
    clearSpotifyData();
    
    // Replace with your Spotify Client ID from the dashboard
    const clientId = "9ec86b7567a34af28e84a6f72e7590a1";
    const redirectUri = `${window.location.origin}/`;
    // Added all necessary scopes for comprehensive music data access
    const scopes = "user-top-read user-read-recently-played user-library-read user-read-playback-state";

    console.log("Spotify redirect URI:", redirectUri);
    console.log("Requesting scopes:", scopes);

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${encodeURIComponent(scopes)}&show_dialog=true`;

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

  const handleDisconnect = () => {
    clearSpotifyData();
    toast.success("Disconnected from Spotify");
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
        
        // Store refresh token and expiry time
        if (data.refresh_token) {
          localStorage.setItem("spotify_refresh_token", data.refresh_token);
        }
        if (data.expires_in) {
          const expiresAt = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000); // refresh 5 min early
          localStorage.setItem("spotify_expires_at", expiresAt.toString());
          // Backward compatibility
          localStorage.setItem("spotify_token_expiry", (expiresAt + (5 * 60 * 1000)).toString());
        }
        
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

  const refreshSpotifyToken = async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem("spotify_refresh_token");
    if (!refreshToken) {
      console.error("No refresh token available");
      return null;
    }

    try {
      console.log("Refreshing Spotify access token...");
      const { data, error } = await supabase.functions.invoke("spotify-auth", {
        body: { refreshToken },
      });

      if (error) throw error;

      if (data.access_token) {
        localStorage.setItem("spotify_access_token", data.access_token);
        
        // Update expiry time
        if (data.expires_in) {
          const expiresAt = Date.now() + (data.expires_in * 1000) - (5 * 60 * 1000);
          localStorage.setItem("spotify_expires_at", expiresAt.toString());
          // Backward compatibility
          localStorage.setItem("spotify_token_expiry", (expiresAt + (5 * 60 * 1000)).toString());
        }
        
        // Store new refresh token if provided
        if (data.refresh_token) {
          localStorage.setItem("spotify_refresh_token", data.refresh_token);
        }
        
        setAccessToken(data.access_token);
        console.log("Token refreshed successfully");
        return data.access_token;
      }
    } catch (error: any) {
      console.error("Error refreshing token:", error);
      toast.error("Session expired. Please reconnect to Spotify.");
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_token_expiry");
      setAccessToken(null);
    }
    return null;
  };

  const getValidToken = async (currentToken: string): Promise<string | null> => {
    const expiresAtStr = localStorage.getItem("spotify_expires_at") || localStorage.getItem("spotify_token_expiry");
    
    if (!expiresAtStr) {
      console.log("No expiry time found, token may be invalid");
      return currentToken;
    }

    const now = Date.now();
    const expiresAt = parseInt(expiresAtStr);
    
    if (now >= expiresAt) {
      console.log("Token expired, refreshing...");
      return await refreshSpotifyToken();
    }
    
    return currentToken;
  };

  const fetchMusicData = async (token: string) => {
    setIsLoading(true);
    setShowLoadingInterlude(true);
    try {
      // Use spotify-data edge function as source of truth
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      const expiresAtStr = localStorage.getItem("spotify_expires_at");

      const { data, error } = await supabase.functions.invoke("spotify-data", {
        body: {
          access_token: token,
          refresh_token: refreshToken ?? undefined,
          expires_at: expiresAtStr ? parseInt(expiresAtStr) : undefined,
        },
      });

      if (error) throw error;
      if (!data || !data.ok) {
        throw new Error(data?.error?.message || "spotify-data returned error");
      }

      // Update tokens if refreshed
      if (data.refreshed_tokens?.access_token) {
        localStorage.setItem("spotify_access_token", data.refreshed_tokens.access_token);
        setAccessToken(data.refreshed_tokens.access_token);
      }
      if (data.refreshed_tokens?.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refreshed_tokens.refresh_token);
      }
      if (data.refreshed_tokens?.expires_at) {
        localStorage.setItem("spotify_expires_at", String(data.refreshed_tokens.expires_at));
      }

      // Use server-computed analysis
      if (data.analysis) {
        console.log("Server-computed vibe energy:", data.analysis.vibeEnergy);
        setEnergyLevel(data.analysis.vibeEnergy);
        
        // Warn if analysis is using defaults (no real audio features)
        if (data.analysis.count === 0 || !data.audioFeatures?.audio_features?.length) {
          console.warn("No audio features retrieved - using default analysis values");
          toast.error("Unable to analyze your music deeply. Try disconnecting and reconnecting to Spotify with full permissions.", {
            duration: 5000,
          });
        }
      }

      // Update UI data
      setTopTracks((data.topTracks?.items || []).slice(0, 5));
      setRecentTracks(data.recentTracks?.items || []);

      // Genres and artists from top artists
      const genres = new Set<string>();
      (data.topArtists?.items || []).forEach((artist: any) => {
        (artist.genres || []).forEach((genre: string) => genres.add(genre));
      });
      setTopGenres(Array.from(genres).slice(0, 5));
      setTopArtists((data.topArtists?.items || []).slice(0, 5));
      
      // Set genre statistics from server
      if (data.genreStats) {
        setGenreStats(data.genreStats);
      }

      // Generate personality, mood board, and weekly summary
      await Promise.all([
        generatePersonality(data.topTracks?.items || [], data.recentTracks?.items || []),
        generateMoodBoard(data.topTracks?.items || [], data.recentTracks?.items || []),
        generateWeeklySummary(data.recentTracks?.items || []),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
      
      setShowLoadingInterlude(false);
    } catch (error: any) {
      console.error("Error fetching music data:", error);
      toast.error("Failed to fetch your music data");
      setShowLoadingInterlude(false);
      // Clear invalid token
      localStorage.removeItem("spotify_access_token");
      localStorage.removeItem("spotify_refresh_token");
      localStorage.removeItem("spotify_expires_at");
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
        <SpotifyDottedLines />
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
              genreStats={genreStats}
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
            <div className="flex justify-end px-4">
              <Button
                onClick={handleDisconnect}
                variant="outline"
                className="border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Disconnect Spotify
              </Button>
            </div>
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

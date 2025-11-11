import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Music } from "lucide-react";
import { TrackList } from "@/components/TrackList";
import { ListeningTimeChart } from "@/components/ListeningTimeChart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [topTracks, setTopTracks] = useState<any[]>([]);
  const [recentTracks, setRecentTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem("spotify_access_token");
    if (token) {
      setAccessToken(token);
      fetchMusicData(token);
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
    try {
      const { data, error } = await supabase.functions.invoke("spotify-auth", {
        body: { code, redirectUri: `${window.location.origin}/` },
      });

      if (error) throw error;

      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem("spotify_access_token", data.access_token);
        await fetchMusicData(data.access_token);
        toast.success("Connected to Spotify!");
      }
    } catch (error: any) {
      console.error("Error exchanging code:", error);
      toast.error("Failed to connect to Spotify");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMusicData = async (token: string) => {
    setIsLoading(true);
    try {
      // Fetch top tracks
      const topTracksResponse = await fetch(
        "https://api.spotify.com/v1/me/top/tracks?limit=5&time_range=medium_term",
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

      setTopTracks(topTracksData.items);
      setRecentTracks(recentTracksData.items);
    } catch (error: any) {
      console.error("Error fetching music data:", error);
      toast.error("Failed to fetch your music data");
      // Clear invalid token
      localStorage.removeItem("spotify_access_token");
      setAccessToken(null);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Music className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Your Music Insights
          </h1>
          <p className="text-muted-foreground text-lg">Connect your Spotify account to see your listening patterns and top tracks</p>
        </div>

        {!accessToken ? (
          <div className="flex justify-center">
            <Button
              onClick={handleConnect}
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg font-semibold rounded-full shadow-[0_8px_32px_hsl(var(--primary)/0.3)] hover:shadow-[0_8px_40px_hsl(var(--primary)/0.4)] transition-all duration-300 hover:scale-105"
            >
              <Music className="mr-2 h-5 w-5" />
              Connect to Spotify
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <ListeningTimeChart recentTracks={recentTracks} />
            <TrackList tracks={topTracks} isLoading={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fetchComprehensiveSpotifyData } from "@/utils/spotifyData";

const Index = () => {
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we're returning from Spotify OAuth
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      // We have a code, exchange it for token
      exchangeCodeForToken(code);
      return;
    }

    // Check if we already have a token
    const token = localStorage.getItem("spotify_access_token");
    if (token) {
      setAccessToken(token);
      handleDataFetch(token);
    } else {
      // No code and no token, go to landing
      navigate("/landing");
    }
  }, []);


  const exchangeCodeForToken = async (code: string) => {
    setIsLoading(true);
    navigate("/analyzing");
    
    try {
      const { data, error } = await supabase.functions.invoke("spotify-auth", {
        body: { code, redirectUri: `${window.location.origin}/` },
      });

      if (error) throw error;

      if (data.access_token) {
        setAccessToken(data.access_token);
        localStorage.setItem("spotify_access_token", data.access_token);
        await handleDataFetch(data.access_token);
        toast.success("Connected to Spotify!");
      }
    } catch (error: any) {
      console.error("Error exchanging code:", error);
      toast.error("Failed to connect to Spotify");
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataFetch = async (token: string) => {
    try {
      const spotifyData = await fetchComprehensiveSpotifyData(token);
      localStorage.setItem("spotify_data", JSON.stringify(spotifyData));
      
      // Get user profile for database
      const profileRes = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profile = await profileRes.json();

      // Generate persona using AI
      const { data, error } = await supabase.functions.invoke("generate-persona", {
        body: {
          spotifyData,
          spotifyId: profile.id,
          email: profile.email,
          displayName: profile.display_name,
        },
      });

      if (error) throw error;

      if (data.persona) {
        localStorage.setItem("current_persona", JSON.stringify(data.persona));
        localStorage.setItem("current_persona_id", data.personaId);
        localStorage.setItem("current_persona_slug", data.publicSlug);
        toast.success("Your persona has been revealed!");
        navigate("/results");
      }
    } catch (error: any) {
      console.error("Error fetching Spotify data:", error);
      toast.error("Failed to fetch your Spotify data");
      localStorage.removeItem("spotify_access_token");
      setAccessToken(null);
      navigate("/landing");
    }
  };

  if (isLoading) {
    return null; // Analyzing page will show
  }

  return null;
};

export default Index;

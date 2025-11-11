import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PersonaCard {
  id: string;
  archetype: string;
  caption: string;
  created_at: string;
}

const Timeline = () => {
  const navigate = useNavigate();
  const [personas, setPersonas] = useState<PersonaCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [spotifyId, setSpotifyId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPersonas = async () => {
      try {
        // Get Spotify profile to find user ID
        const token = localStorage.getItem("spotify_access_token");
        if (!token) {
          toast.error("Please connect to Spotify first");
          navigate("/landing");
          return;
        }

        const profileRes = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profile = await profileRes.json();
        setSpotifyId(profile.id);

        // Fetch user from database
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("spotify_id", profile.id)
          .single();

        if (!user) {
          setPersonas([]);
          setLoading(false);
          return;
        }

        // Fetch all personas for this user
        const { data: personasData, error } = await supabase
          .from("personas")
          .select("id, archetype, caption, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setPersonas(personasData || []);
      } catch (error) {
        console.error("Error fetching personas:", error);
        toast.error("Failed to load your timeline");
      } finally {
        setLoading(false);
      }
    };

    fetchUserPersonas();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-[hsl(263,70%,15%)] to-[hsl(186,94%,20%)] flex items-center justify-center">
        <div className="text-center">
          <Calendar className="w-12 h-12 text-cosmic-purple animate-pulse mx-auto mb-4" />
          <p className="text-foreground/70">Loading your timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-[hsl(263,70%,15%)] to-[hsl(186,94%,20%)] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-foreground/10"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/results")}
              className="text-foreground/70 hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-cyan bg-clip-text text-transparent">
              Your Timeline
            </h1>
            <div className="w-20" />
          </div>

          {/* Personas Grid */}
          {personas.length === 0 ? (
            <Card className="bg-cosmic-dark/50 border-cosmic-purple/30 p-12 text-center">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground/70 text-lg mb-2">No personas yet</p>
              <p className="text-muted-foreground text-sm">
                Generate your first persona to start building your timeline
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas.map((persona, index) => (
                <Card
                  key={persona.id}
                  className="bg-gradient-to-br from-cosmic-dark/80 to-cosmic-deep/80 backdrop-blur-sm border-cosmic-purple/30 p-6 space-y-4 hover:shadow-[0_0_30px_hsl(var(--cosmic-purple)/0.3)] transition-all cursor-pointer animate-fade-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-cyan bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                      the {persona.archetype}
                    </h3>
                    <p className="text-sm text-foreground/70 italic line-clamp-2">
                      "{persona.caption}"
                    </p>
                  </div>
                  
                  <div className="pt-4 border-t border-cosmic-purple/20">
                    <p className="text-xs text-muted-foreground text-center">
                      {formatDate(persona.created_at)}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Timeline;

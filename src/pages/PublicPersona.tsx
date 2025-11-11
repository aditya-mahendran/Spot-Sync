import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Persona {
  archetype: string;
  caption: string;
  traits: string[];
  recommendations: {
    artists: string[];
    genres: string[];
    tracks: string[];
  };
  rationale: string;
  created_at: string;
}

const PublicPersona = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicPersona = async () => {
      if (!slug) {
        navigate("/landing");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("personas")
          .select("archetype, caption, traits, recommendations, rationale, created_at")
          .eq("public_slug", slug)
          .single();

        if (error || !data) {
          toast.error("Persona not found");
          navigate("/landing");
          return;
        }

        setPersona(data);
      } catch (error) {
        console.error("Error fetching public persona:", error);
        toast.error("Failed to load persona");
        navigate("/landing");
      } finally {
        setLoading(false);
      }
    };

    fetchPublicPersona();
  }, [slug, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-[hsl(263,70%,15%)] to-[hsl(186,94%,20%)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cosmic-purple/20 animate-pulse mb-4">
            <Sparkles className="w-8 h-8 text-cosmic-purple" />
          </div>
          <p className="text-foreground/70">Loading persona...</p>
        </div>
      </div>
    );
  }

  if (!persona) return null;

  const getGradient = () => {
    const lower = persona.archetype.toLowerCase();
    if (lower.includes("pop") || lower.includes("hyperpop")) {
      return "from-pink-500/20 via-purple-500/20 to-cyan-500/20";
    } else if (lower.includes("hip") || lower.includes("rap")) {
      return "from-orange-500/20 via-red-500/20 to-black/20";
    } else if (lower.includes("indie") || lower.includes("lo-fi")) {
      return "from-yellow-500/20 via-green-500/20 to-blue-500/20";
    } else if (lower.includes("electronic") || lower.includes("dance")) {
      return "from-cyan-500/20 via-blue-500/20 to-purple-500/20";
    }
    return "from-cosmic-purple/20 via-cosmic-cyan/20 to-cosmic-purple/20";
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getGradient()} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-cosmic-deep/80" />
      
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-foreground/10"
            style={{
              width: Math.random() * 4 + 1 + "px",
              height: Math.random() * 4 + 1 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animation: `twinkle ${Math.random() * 3 + 2}s infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8">
          <Card className="bg-gradient-to-br from-cosmic-dark/90 to-cosmic-deep/90 backdrop-blur-xl border-cosmic-purple/30 p-8 md:p-12 space-y-6 animate-fade-in rounded-3xl shadow-[0_0_50px_hsl(var(--cosmic-purple)/0.3)]">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cosmic-purple via-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent leading-tight">
                the {persona.archetype}
              </h1>
              <p className="text-lg md:text-xl text-foreground/90 italic leading-relaxed">
                "{persona.caption}"
              </p>
            </div>

            <div className="flex flex-wrap gap-3 justify-center pt-4">
              {persona.traits.map((trait, index) => (
                <Badge
                  key={index}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-cosmic-purple/20 to-cosmic-cyan/20 border-cosmic-purple/40 text-foreground"
                >
                  {trait}
                </Badge>
              ))}
            </div>

            <div className="pt-4 text-center">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {persona.rationale}
              </p>
            </div>

            <div className="pt-6 space-y-4 border-t border-cosmic-purple/20">
              <h3 className="text-sm font-semibold text-cosmic-cyan uppercase tracking-wider">
                Recommendations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-2">Artists</p>
                  <ul className="space-y-1">
                    {persona.recommendations.artists.map((artist, i) => (
                      <li key={i} className="text-foreground/80">• {artist}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Genres</p>
                  <ul className="space-y-1">
                    {persona.recommendations.genres.map((genre, i) => (
                      <li key={i} className="text-foreground/80">• {genre}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Tracks</p>
                  <ul className="space-y-1">
                    {persona.recommendations.tracks.map((track, i) => (
                      <li key={i} className="text-foreground/80">• {track}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-muted-foreground text-sm">
              Want to discover your own music persona?
            </p>
            <Button
              onClick={() => navigate("/landing")}
              className="bg-gradient-to-r from-cosmic-purple to-cosmic-cyan hover:shadow-[0_0_30px_hsl(var(--cosmic-purple)/0.5)] transition-all"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Create Your FanChart
            </Button>
          </div>
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

export default PublicPersona;

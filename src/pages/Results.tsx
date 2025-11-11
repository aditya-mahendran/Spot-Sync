import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, Download, RefreshCw, Trash2, Calendar } from "lucide-react";
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
  style: string;
}

const Results = () => {
  const navigate = useNavigate();
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  useEffect(() => {
    const storedPersona = localStorage.getItem("current_persona");
    const storedId = localStorage.getItem("current_persona_id");
    const storedSlug = localStorage.getItem("current_persona_slug");

    if (storedPersona) {
      setPersona(JSON.parse(storedPersona));
      setPersonaId(storedId);
      setPublicSlug(storedSlug);
    } else {
      navigate("/landing");
    }
  }, [navigate]);

  const handleDownload = async () => {
    const html2canvas = (await import("html2canvas")).default;
    const cardElement = document.getElementById("persona-card");
    
    if (!cardElement) {
      toast.error("Card not found");
      return;
    }

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
      });
      
      const link = document.createElement("a");
      link.download = `fanchart-${persona.archetype.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      
      toast.success("Persona downloaded!");
    } catch (error) {
      console.error("Error downloading:", error);
      toast.error("Failed to download. Try screenshot instead.");
    }
  };

  const handleShare = () => {
    if (publicSlug) {
      const shareUrl = `${window.location.origin}/u/${publicSlug}`;
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied! Prepare for unsolicited personality feedback. 😏");
    }
  };

  const handleRegenerate = () => {
    toast.info("Regeneration coming soon!");
  };

  const handleDeleteData = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_data");
    localStorage.removeItem("current_persona");
    localStorage.removeItem("current_persona_id");
    localStorage.removeItem("current_persona_slug");
    toast.success("Data cleared!");
    navigate("/landing");
  };

  if (!persona) {
    return null;
  }

  // Generate gradient based on archetype
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
      {/* Animated background */}
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

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl space-y-8">
          {/* Persona Card */}
          <Card 
            id="persona-card"
            className="bg-gradient-to-br from-cosmic-dark/90 to-cosmic-deep/90 backdrop-blur-xl border-cosmic-purple/30 p-8 md:p-12 space-y-6 animate-fade-in rounded-3xl shadow-[0_0_50px_hsl(var(--cosmic-purple)/0.3)]"
          >
            {/* Archetype */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cosmic-purple via-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent leading-tight">
                the {persona.archetype}
              </h1>
              <p className="text-lg md:text-xl text-foreground/90 italic leading-relaxed">
                "{persona.caption}"
              </p>
            </div>

            {/* Traits */}
            <div className="flex flex-wrap gap-3 justify-center pt-4">
              {persona.traits.map((trait, index) => (
                <Badge
                  key={index}
                  className="px-4 py-2 text-sm bg-gradient-to-r from-cosmic-purple/20 to-cosmic-cyan/20 border-cosmic-purple/40 text-foreground hover:shadow-[0_0_20px_hsl(var(--cosmic-purple)/0.4)] transition-all"
                >
                  {trait}
                </Badge>
              ))}
            </div>

            {/* Rationale */}
            <div className="pt-4 text-center">
              <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                {persona.rationale}
              </p>
            </div>

            {/* Recommendations */}
            <div className="pt-6 space-y-4 border-t border-cosmic-purple/20">
              <h3 className="text-sm font-semibold text-cosmic-cyan uppercase tracking-wider">
                You Might Vibe With
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 justify-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <Button
              onClick={() => navigate("/timeline")}
              variant="outline"
              className="border-cosmic-cyan/50 bg-cosmic-dark/50 hover:bg-cosmic-cyan/20"
            >
              <Calendar className="mr-2 h-4 w-4" />
              View Timeline
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="border-cosmic-purple/50 bg-cosmic-dark/50 hover:bg-cosmic-purple/20"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PNG
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="border-cosmic-cyan/50 bg-cosmic-dark/50 hover:bg-cosmic-cyan/20"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="border-cosmic-purple/50 bg-cosmic-dark/50 hover:bg-cosmic-purple/20"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate
            </Button>
            <Button
              onClick={handleDeleteData}
              variant="outline"
              className="border-destructive/50 bg-cosmic-dark/50 hover:bg-destructive/20"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete My Data
            </Button>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Results;

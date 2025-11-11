import { Button } from "@/components/ui/button";
import { Music, Sparkles } from "lucide-react";

const Landing = () => {
  const handleConnect = () => {
    const clientId = "9ec86b7567a34af28e84a6f72e7590a1";
    const redirectUri = `${window.location.origin}/`;
    const scopes = "user-top-read user-read-recently-played";

    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
      redirectUri,
    )}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-[hsl(263,70%,15%)] to-[hsl(186,94%,20%)] relative overflow-hidden">
      {/* Animated starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-foreground/30"
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

      {/* Gradient aurora overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cosmic-purple/10 to-cosmic-cyan/10 animate-pulse" style={{ animationDuration: '4s' }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cosmic-purple to-cosmic-cyan p-[2px] animate-fade-in">
            <div className="w-full h-full rounded-full bg-cosmic-deep flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-cosmic-cyan" />
            </div>
          </div>

          {/* Hero Text */}
          <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h1 className="text-6xl md:text-7xl font-bold bg-gradient-to-r from-foreground via-cosmic-cyan to-cosmic-purple bg-clip-text text-transparent leading-tight">
              FanChart
            </h1>
            <p className="text-2xl md:text-3xl text-foreground/90 font-light max-w-2xl mx-auto leading-relaxed">
              Your playlists know you better than your therapist
            </p>
          </div>

          {/* Subtext */}
          <p className="text-lg text-muted-foreground max-w-xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Let's decode your vibe — no judgment (ok, a little)
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={handleConnect}
              size="lg"
              className="relative px-8 py-6 text-lg font-semibold rounded-full bg-gradient-to-r from-cosmic-purple to-cosmic-cyan hover:shadow-[0_0_50px_hsl(var(--cosmic-purple)/0.5)] transition-all duration-300 hover:scale-105 group"
            >
              <Music className="mr-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              Connect Spotify
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cosmic-purple to-cosmic-cyan opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-lg rounded-full border-2 border-cosmic-purple/50 bg-cosmic-dark/50 hover:bg-cosmic-dark hover:border-cosmic-purple transition-all duration-300"
            >
              See Examples
            </Button>
          </div>

          {/* Assurance text */}
          <p className="text-sm text-muted-foreground/70 max-w-md mx-auto pt-8 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            Read-only access. We don't post, DM your ex, or mess with your playlists.
          </p>
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

export default Landing;

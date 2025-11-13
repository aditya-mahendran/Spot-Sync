import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VibeSpectrumProps {
  genreStats: Array<{ genre: string; count: number }>;
  onColorChange?: (color: string) => void;
}

export const VibeSpectrum = ({ genreStats, onColorChange }: VibeSpectrumProps) => {
  const [dominantColor, setDominantColor] = useState("hsl(240, 57%, 50%)");
  const [userPosition, setUserPosition] = useState(50);
  const [vibeWord, setVibeWord] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Map genres to intensity (0 = lofi/chill, 100 = death metal/intense)
  const getGenreIntensity = (genre: string): number => {
    const g = genre.toLowerCase();
    
    // Death metal / Heavy (90-100)
    if (g.includes('death metal') || g.includes('black metal') || g.includes('grindcore')) return 95;
    if (g.includes('metal') || g.includes('hardcore') || g.includes('punk')) return 85;
    if (g.includes('rock') || g.includes('alternative')) return 70;
    
    // Mid-range (40-70)
    if (g.includes('pop') || g.includes('indie') || g.includes('electronic')) return 55;
    if (g.includes('hip hop') || g.includes('rap') || g.includes('trap')) return 60;
    if (g.includes('r&b') || g.includes('soul')) return 45;
    if (g.includes('folk') || g.includes('acoustic')) return 35;
    
    // Lofi / Chill (0-40)
    if (g.includes('lo-fi') || g.includes('lofi') || g.includes('chill')) return 10;
    if (g.includes('ambient') || g.includes('meditation')) return 15;
    if (g.includes('jazz') || g.includes('classical')) return 25;
    
    // Default to middle
    return 50;
  };

  // Position genres on the spectrum with their intensity and count
  const genresWithPosition = genreStats.map(g => ({
    ...g,
    intensity: getGenreIntensity(g.genre),
  })).sort((a, b) => a.intensity - b.intensity);

  useEffect(() => {
    // Calculate user's average position
    if (genresWithPosition.length > 0) {
      const avgIntensity = genresWithPosition.reduce((sum, g) => sum + g.intensity * g.count, 0) / 
                          genresWithPosition.reduce((sum, g) => sum + g.count, 0);
      
      setUserPosition(avgIntensity);
      
      // Map intensity to color: lofi (purple/blue) to death metal (red)
      const hue = 280 - (avgIntensity * 2.8); // 280 (purple) to 0 (red)
      const color = `hsl(${hue}, 70%, 55%)`;
      setDominantColor(color);
      onColorChange?.(color);

      // Generate AI descriptor
      generateVibeWord(avgIntensity, genresWithPosition.slice(0, 5).map(g => g.genre));
    }
  }, [genreStats, genresWithPosition, onColorChange]);

  const generateVibeWord = async (intensity: number, topGenres: string[]) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-vibe-word", {
        body: { 
          intensity,
          genres: topGenres
        },
      });

      if (error) throw error;
      if (data?.word) {
        setVibeWord(data.word);
      }
    } catch (error) {
      console.error("Error generating vibe word:", error);
      // Fallback based on intensity
      if (intensity < 20) setVibeWord("Serene");
      else if (intensity < 40) setVibeWord("Mellow");
      else if (intensity < 60) setVibeWord("Balanced");
      else if (intensity < 80) setVibeWord("Energetic");
      else setVibeWord("Intense");
    } finally {
      setIsGenerating(false);
    }
  };

  const getColorForIntensity = (intensity: number) => {
    const hue = 280 - (intensity * 2.8); // 280 (purple) to 0 (red)
    return `hsl(${hue}, 70%, 60%)`;
  };

  if (genresWithPosition.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto mb-8">
        <div className="text-center text-muted-foreground">
          Connect to Spotify to see your intensity spectrum
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto mb-12 px-4">
      <div className="space-y-6">
        <div className="text-center">
          <motion.h2
            className="text-4xl font-bold mb-2"
            style={{ color: dominantColor }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {isGenerating ? "..." : vibeWord || "Your Vibe"}
          </motion.h2>
        </div>

        {/* Spectrum bar */}
        <div className="relative">
          {/* Gradient bar */}
          <div className="relative h-16 rounded-lg overflow-visible bg-gradient-to-r from-purple-600 via-yellow-500 to-red-600">
            {/* Genre markers (no counts) */}
            {genresWithPosition.slice(0, 15).map((genre, index) => {
              const size = 24;
              const color = getColorForIntensity(genre.intensity);
              
              return (
                <motion.div
                  key={genre.genre}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer group"
                  style={{ left: `${genre.intensity}%` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.7, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.3, opacity: 1, zIndex: 50 }}
                >
                  <div
                    className="rounded-full border-2 border-white shadow-lg"
                    style={{ 
                      width: size,
                      height: size,
                      backgroundColor: color,
                    }}
                  />
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-background border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    <div className="text-xs font-semibold">{genre.genre}</div>
                    <div className="text-xs text-muted-foreground">{genre.count} tracks</div>
                  </div>
                </motion.div>
              );
            })}

            {/* User position indicator line */}
            <motion.div
              className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
              style={{ 
                left: `${userPosition}%`,
                boxShadow: `0 0 20px ${dominantColor}, 0 0 40px ${dominantColor}`,
              }}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="text-center text-xs text-muted-foreground/70">
          Your music intensity • Hover bubbles for details
        </div>
      </div>
    </div>
  );
};

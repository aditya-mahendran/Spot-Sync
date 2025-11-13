import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface VibeSpectrumProps {
  genreStats: Array<{ genre: string; count: number }>;
  onColorChange?: (color: string) => void;
}

export const VibeSpectrum = ({ genreStats, onColorChange }: VibeSpectrumProps) => {
  const [dominantColor, setDominantColor] = useState("hsl(240, 57%, 50%)");

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
    // Set color based on overall intensity
    if (genresWithPosition.length > 0) {
      const avgIntensity = genresWithPosition.reduce((sum, g) => sum + g.intensity * g.count, 0) / 
                          genresWithPosition.reduce((sum, g) => sum + g.count, 0);
      
      // Map intensity to color: lofi (purple/blue) to death metal (red)
      const hue = 280 - (avgIntensity * 2.8); // 280 (purple) to 0 (red)
      const color = `hsl(${hue}, 70%, 55%)`;
      setDominantColor(color);
      onColorChange?.(color);
    }
  }, [genreStats, genresWithPosition, onColorChange]);

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
            className="text-2xl font-bold mb-2"
            style={{ color: dominantColor }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your Music Intensity Spectrum
          </motion.h2>
          <p className="text-sm text-muted-foreground">
            From chill lofi to heavy metal
          </p>
        </div>

        {/* Spectrum bar */}
        <div className="relative">
          {/* Labels */}
          <div className="flex justify-between items-center text-sm font-medium mb-3">
            <span className="text-purple-400">Lofi / Chill</span>
            <span className="text-red-400">Death Metal / Intense</span>
          </div>

          {/* Gradient bar */}
          <div className="relative h-16 rounded-lg overflow-hidden bg-gradient-to-r from-purple-600 via-yellow-500 to-red-600">
            {/* Genre markers */}
            {genresWithPosition.slice(0, 15).map((genre, index) => {
              const size = Math.min(Math.max(genre.count * 3, 30), 80);
              const color = getColorForIntensity(genre.intensity);
              
              return (
                <motion.div
                  key={genre.genre}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer group"
                  style={{ left: `${genre.intensity}%` }}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 0.9, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  whileHover={{ scale: 1.2, opacity: 1, zIndex: 50 }}
                >
                  <div
                    className="rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                    style={{ 
                      width: size,
                      height: size,
                      backgroundColor: color,
                    }}
                  >
                    <span className="text-white text-xs font-bold">
                      {genre.count}
                    </span>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-background border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                    <div className="text-xs font-semibold">{genre.genre}</div>
                    <div className="text-xs text-muted-foreground">{genre.count} tracks</div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Intensity scale */}
          <div className="flex justify-between text-xs text-muted-foreground/60 mt-2">
            <span>0</span>
            <span>25</span>
            <span>50</span>
            <span>75</span>
            <span>100</span>
          </div>
        </div>

        {/* Legend */}
        <div className="text-center text-xs text-muted-foreground/70">
          Bubble size represents track count • Hover to see details
        </div>
      </div>
    </div>
  );
};

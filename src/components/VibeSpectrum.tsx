import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface VibeSpectrumProps {
  genreStats: Array<{ genre: string; count: number }>;
  onColorChange?: (color: string) => void;
}

export const VibeSpectrum = ({ genreStats, onColorChange }: VibeSpectrumProps) => {
  const [dominantColor, setDominantColor] = useState("hsl(240, 57%, 50%)");

  // Take top 10 genres for the spectrum
  const topGenres = genreStats.slice(0, 10);
  const totalCount = topGenres.reduce((sum, g) => sum + g.count, 0);

  useEffect(() => {
    // Generate a color based on the top genre
    if (topGenres.length > 0) {
      const hue = Math.abs(hashCode(topGenres[0].genre)) % 360;
      const color = `hsl(${hue}, 70%, 55%)`;
      setDominantColor(color);
      onColorChange?.(color);
    }
  }, [genreStats, onColorChange, topGenres]);

  // Simple hash function to get consistent colors for genres
  const hashCode = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  };

  const getColorForGenre = (genre: string, index: number) => {
    const hue = (Math.abs(hashCode(genre)) + index * 30) % 360;
    return `hsl(${hue}, 70%, 60%)`;
  };

  if (topGenres.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div className="text-center text-muted-foreground">
          Connect to Spotify to see your genre spectrum
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-8 px-4">
      <div className="space-y-4">
        <div className="text-center">
          <motion.h2
            className="text-2xl font-bold mb-2"
            style={{ color: dominantColor }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Your Genre Spectrum
          </motion.h2>
          <p className="text-sm text-muted-foreground">
            Distribution across {genreStats.length} genres
          </p>
        </div>

        {/* Genre bars spectrum */}
        <div className="space-y-2">
          {topGenres.map((genre, index) => {
            const percentage = (genre.count / totalCount) * 100;
            const color = getColorForGenre(genre.genre, index);

            return (
              <motion.div
                key={genre.genre}
                className="space-y-1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex justify-between items-center text-sm">
                  <span className="text-foreground font-medium truncate flex-1">
                    {genre.genre}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    {genre.count} tracks
                  </span>
                </div>
                <div className="relative h-2 rounded-full bg-muted/30 overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {genreStats.length > 10 && (
          <div className="text-center text-xs text-muted-foreground/60 pt-2">
            + {genreStats.length - 10} more genres in your library
          </div>
        )}
      </div>
    </div>
  );
};

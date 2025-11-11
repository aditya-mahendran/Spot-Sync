import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface VibeSpectrumProps {
  energyLevel: number; // 0-100
  onColorChange?: (color: string) => void;
}

export const VibeSpectrum = ({ energyLevel, onColorChange }: VibeSpectrumProps) => {
  const [vibeColor, setVibeColor] = useState("");

  useEffect(() => {
    // Map energy level (0-100) to color between indigo and orange
    // Indigo: hsl(240, 57%, 50%) at 0
    // Orange: hsl(25, 95%, 53%) at 100
    const hue = 240 - (energyLevel / 100) * 215; // 240 (indigo) to 25 (orange)
    const saturation = 57 + (energyLevel / 100) * 38; // 57% to 95%
    const lightness = 50 + (energyLevel / 100) * 3; // 50% to 53%
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    setVibeColor(color);
    onColorChange?.(color);
  }, [energyLevel, onColorChange]);

  const getVibeLabel = () => {
    if (energyLevel < 25) return "Deeply Mellow";
    if (energyLevel < 40) return "Chill Vibes";
    if (energyLevel < 60) return "Balanced Energy";
    if (energyLevel < 75) return "Upbeat Flow";
    return "Maximum Energy";
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Mellow</span>
          <motion.span
            className="font-semibold text-lg"
            style={{ color: vibeColor }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {getVibeLabel()}
          </motion.span>
          <span className="text-muted-foreground">Energetic</span>
        </div>
        
        {/* Spectrum bar */}
        <div className="relative h-3 rounded-full overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-500 via-pink-500 to-orange-500">
          {/* Indicator */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-lg"
            initial={{ left: "50%" }}
            animate={{ left: `${energyLevel}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              boxShadow: `0 0 20px ${vibeColor}, 0 0 40px ${vibeColor}`,
            }}
          />
        </div>
        
        <div className="text-center text-xs text-muted-foreground/60">
          Your average vibe energy: {energyLevel.toFixed(0)}%
        </div>
      </div>
    </div>
  );
};

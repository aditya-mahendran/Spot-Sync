import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface MusicPersonalityProps {
  personality: string;
  isLoading: boolean;
}

export const MusicPersonality = ({ personality, isLoading }: MusicPersonalityProps) => {
  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Music Personality
          </CardTitle>
          <CardDescription>AI is analyzing your vibes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-primary/10 rounded animate-pulse" />
            <div className="h-4 bg-primary/10 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-primary/10 rounded animate-pulse w-4/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!personality) return null;

  // Split personality into lines
  const lines = personality.split("\n").filter(line => line.trim());

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="w-full relative overflow-hidden border-primary/30">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cosmic-purple/20 via-primary/10 to-cosmic-pink/20 animate-pulse" style={{ animationDuration: '3s' }} />
        
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              initial={{
                x: Math.random() * 100 + '%',
                y: '100%',
              }}
              animate={{
                y: '-10%',
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "linear",
              }}
            />
          ))}
        </div>

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5 text-primary" />
            </motion.div>
            Your Music Personality
          </CardTitle>
          <CardDescription>According to your listening habits</CardDescription>
        </CardHeader>
        
        <CardContent className="relative z-10">
          <div className="space-y-4">
            {lines.map((line, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.2, duration: 0.4 }}
                className="text-lg font-medium leading-relaxed"
              >
                {line.replace(/^\d+\.\s*/, "").trim()}
              </motion.p>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

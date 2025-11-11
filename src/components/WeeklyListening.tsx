import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface WeeklyListeningProps {
  description: string;
  vibeWord: string;
  vibeColor: string;
  isLoading: boolean;
}

const WeeklyListening = ({ description, vibeWord, vibeColor, isLoading }: WeeklyListeningProps) => {
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-cosmic-purple/10 via-background to-cosmic-pink/10 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold">What You Listened To This Week</h2>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
        </div>
      </Card>
    );
  }

  if (!description) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-cosmic-purple/10 via-background to-cosmic-pink/10 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-5 h-5" style={{ color: vibeColor }} />
          </motion.div>
          <h2 className="text-2xl font-bold">What You Listened To This Week</h2>
        </div>
        
        <motion.p
          className="text-muted-foreground leading-relaxed mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-sm text-muted-foreground">Overall vibe:</span>
          <motion.span
            className="text-2xl font-bold"
            style={{ color: vibeColor }}
            animate={{
              textShadow: [
                `0 0 10px ${vibeColor}40`,
                `0 0 20px ${vibeColor}60`,
                `0 0 10px ${vibeColor}40`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {vibeWord}
          </motion.span>
        </motion.div>
      </motion.div>
    </Card>
  );
};

export default WeeklyListening;

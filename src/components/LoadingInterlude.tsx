import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Music } from "lucide-react";

const loadingLines = [
  "Tuning your emotional BPM…",
  "Scanning for guilty pleasures…",
  "Checking for 3 a.m. heartbreak streams…",
  "Balancing your main-character energy…",
  "Analyzing ratio of indie angst to club anthems…",
  "Decoding your musical therapy sessions…",
  "Measuring your vibe sophistication…",
];

export const LoadingInterlude = () => {
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(
    loadingLines[Math.floor(Math.random() * loadingLines.length)]
  );

  useEffect(() => {
    // Progress animation
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 15;
      });
    }, 200);

    // Rotate loading lines
    const lineTimer = setInterval(() => {
      setCurrentLine(loadingLines[Math.floor(Math.random() * loadingLines.length)]);
    }, 2000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(lineTimer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6 space-y-8">
        {/* Spinning record/orbit animation */}
        <motion.div
          className="w-24 h-24 mx-auto relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="absolute inset-0 rounded-full border-2 border-primary/30" />
          <div className="absolute inset-2 rounded-full border-2 border-primary/50" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center">
            <Music className="w-8 h-8 text-primary" />
          </div>
          <motion.div
            className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -ml-1"
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.div>

        {/* Loading text */}
        <motion.div
          key={currentLine}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center"
        >
          <p className="text-lg font-medium text-foreground/90">{currentLine}</p>
        </motion.div>

        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground text-center">
            Read-only access. We don't post, DM your ex, or mess with your playlists.
          </p>
        </div>
      </div>
    </div>
  );
};

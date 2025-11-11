import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const loadingMessages = [
  "Tuning your emotional BPM...",
  "Scanning for guilty pleasures...",
  "Checking for 3 a.m. heartbreak streams...",
  "Balancing your main-character energy...",
  "Analyzing ratio of indie angst to club anthems...",
  "Decoding your midnight listening habits...",
  "Measuring your vibe frequency...",
  "Computing your playlist personality...",
];

const Analyzing = () => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + Math.random() * 15;
      });
    }, 300);

    return () => {
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-deep via-[hsl(263,70%,15%)] to-[hsl(186,94%,20%)] relative overflow-hidden flex items-center justify-center">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-foreground/20"
            style={{
              width: Math.random() * 4 + 2 + "px",
              height: Math.random() * 4 + 2 + "px",
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
              animation: `float ${Math.random() * 3 + 3}s infinite ${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full px-6 space-y-8 text-center">
        {/* Spinning loader */}
        <div className="flex justify-center">
          <div className="relative">
            <Loader2 className="w-20 h-20 text-cosmic-purple animate-spin" />
            <div className="absolute inset-0 blur-xl bg-cosmic-purple/30 animate-pulse" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-4">
          <p className="text-2xl text-foreground font-light animate-fade-in">
            {loadingMessages[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-2 bg-cosmic-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cosmic-purple to-cosmic-cyan transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {Math.min(Math.round(progress), 100)}%
          </p>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default Analyzing;

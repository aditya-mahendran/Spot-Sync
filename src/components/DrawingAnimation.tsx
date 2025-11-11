import { motion } from "framer-motion";
import { Music } from "lucide-react";

const DrawingAnimation = () => {
  return (
    <motion.div
      className="absolute top-20 right-20 pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.3, 0.3, 0] }}
      transition={{
        duration: 4,
        repeat: Infinity,
        repeatDelay: 2,
        times: [0, 0.2, 0.8, 1],
      }}
    >
      <motion.div
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: [0, 1, 1, 0], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatDelay: 2,
          times: [0, 0.4, 0.8, 1],
        }}
      >
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-primary/40"
        >
          <motion.path
            d="M30 90 L30 40 M30 40 L50 35 M50 35 L50 75 M50 75 Q 65 75 65 60 Q 65 45 50 45"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
              times: [0, 0.4, 0.8, 1],
            }}
          />
          <motion.circle
            cx="30"
            cy="85"
            r="8"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
              times: [0, 0.5, 0.9, 1],
            }}
          />
          <motion.circle
            cx="50"
            cy="80"
            r="8"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: [0, 1, 1, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              repeatDelay: 2,
              times: [0, 0.5, 0.9, 1],
            }}
          />
        </svg>
      </motion.div>
      <motion.div
        className="absolute -bottom-6 left-0 right-0 text-center text-xs text-muted-foreground/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.5, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatDelay: 2,
          times: [0, 0.3, 0.7, 1],
        }}
      >
        drawing your vibe...
      </motion.div>
    </motion.div>
  );
};

export default DrawingAnimation;

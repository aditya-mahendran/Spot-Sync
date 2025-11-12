import { motion } from "framer-motion";

export const SpotifyDottedLines = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Horizontal dotted lines */}
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: "20%" }}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-[2px] border-t-2 border-dotted border-primary/30" />
      </motion.div>
      
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: "45%" }}
        initial={{ x: "100%" }}
        animate={{ x: "-100%" }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-[2px] border-t-2 border-dotted border-primary/40" />
      </motion.div>
      
      <motion.div
        className="absolute left-0 right-0"
        style={{ top: "70%" }}
        initial={{ x: "-100%" }}
        animate={{ x: "100%" }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        <div className="h-[2px] border-t-2 border-dotted border-primary/30" />
      </motion.div>
    </div>
  );
};

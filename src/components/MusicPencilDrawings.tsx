import { motion } from "framer-motion";
import { Music, Disc, Guitar, Mic2, Headphones, Radio } from "lucide-react";

const MusicPencilDrawings = () => {
  const icons = [Music, Disc, Guitar, Mic2, Headphones, Radio];
  
  // Generate random positions for left and right sides
  const leftDrawings = Array.from({ length: 8 }, (_, i) => ({
    Icon: icons[i % icons.length],
    top: `${(i + 1) * 12}%`,
    left: '2%',
    rotation: Math.random() * 30 - 15,
    delay: i * 0.3,
  }));

  const rightDrawings = Array.from({ length: 8 }, (_, i) => ({
    Icon: icons[(i + 3) % icons.length],
    top: `${(i + 1) * 12}%`,
    right: '2%',
    rotation: Math.random() * 30 - 15,
    delay: i * 0.3 + 0.15,
  }));

  return (
    <>
      {/* Left side drawings */}
      {leftDrawings.map((drawing, i) => (
        <motion.div
          key={`left-${i}`}
          className="absolute pointer-events-none opacity-10"
          style={{
            top: drawing.top,
            left: drawing.left,
            rotate: `${drawing.rotation}deg`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{
            delay: drawing.delay,
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 3,
          }}
        >
          <drawing.Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
        </motion.div>
      ))}

      {/* Right side drawings */}
      {rightDrawings.map((drawing, i) => (
        <motion.div
          key={`right-${i}`}
          className="absolute pointer-events-none opacity-10"
          style={{
            top: drawing.top,
            right: drawing.right,
            rotate: `${drawing.rotation}deg`,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{
            delay: drawing.delay,
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            repeatDelay: 3,
          }}
        >
          <drawing.Icon className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
        </motion.div>
      ))}
    </>
  );
};

export default MusicPencilDrawings;

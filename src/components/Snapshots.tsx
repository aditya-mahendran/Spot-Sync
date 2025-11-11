import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";
import { motion } from "framer-motion";

interface Snapshot {
  id: string;
  imageUrl: string;
  tint: string;
  date: string;
}

interface SnapshotsProps {
  snapshots: Snapshot[];
  onCommitSnapshot: () => void;
  onDeleteSnapshot: (id: string) => void;
  hasImages: boolean;
}

const Snapshots = ({ snapshots, onCommitSnapshot, onDeleteSnapshot, hasImages }: SnapshotsProps) => {
  // Create array of 30 slots
  const slots = Array.from({ length: 30 }, (_, i) => {
    const snapshot = snapshots[i];
    return { index: i, snapshot };
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Memory Snapshots</h2>
          <p className="text-muted-foreground text-sm">
            Capture your vibe each month
          </p>
        </div>
        <Button
          onClick={onCommitSnapshot}
          disabled={!hasImages}
          className="bg-gradient-to-r from-primary to-cosmic-purple hover:from-primary/90 hover:to-cosmic-purple/90"
        >
          <Camera className="mr-2 h-4 w-4" />
          Commit to Snapshot
        </Button>
      </div>
      
      <div className="grid grid-cols-5 gap-3">
        {slots.map(({ index, snapshot }) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.02 }}
            className="aspect-square relative border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden bg-background/50"
            style={{
              boxShadow: snapshot ? '0 0 10px rgba(var(--primary), 0.3)' : 'none',
            }}
          >
            {snapshot ? (
              <div className="relative w-full h-full group/snapshot">
                <div 
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${snapshot.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'sepia(0.2) saturate(1.2)',
                  }}
                >
                  <div 
                    className="w-full h-full"
                    style={{
                      backgroundColor: snapshot.tint,
                      mixBlendMode: 'overlay',
                    }}
                  />
                </div>
                <button
                  onClick={() => onDeleteSnapshot(snapshot.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center opacity-0 group-hover/snapshot:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1">
                  <p className="text-white text-[8px] text-center">
                    {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-dashed border-muted-foreground/20 rounded-full" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
};

export default Snapshots;

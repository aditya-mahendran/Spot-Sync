import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

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
  const SNAPSHOTS_PER_PAGE = 30; // 6x5 grid
  const TOTAL_SNAPSHOTS = 365;
  const totalSections = Math.ceil(TOTAL_SNAPSHOTS / SNAPSHOTS_PER_PAGE);
  
  const [currentSection, setCurrentSection] = useState(0);

  // Create array of 365 slots for daily snapshots
  const allSlots = Array.from({ length: TOTAL_SNAPSHOTS }, (_, i) => {
    const snapshot = snapshots[i];
    return { index: i, snapshot };
  });

  // Get slots for current section
  const startIndex = currentSection * SNAPSHOTS_PER_PAGE;
  const endIndex = startIndex + SNAPSHOTS_PER_PAGE;
  const currentSlots = allSlots.slice(startIndex, endIndex);

  const goToPreviousSection = () => {
    setCurrentSection(prev => Math.max(0, prev - 1));
  };

  const goToNextSection = () => {
    setCurrentSection(prev => Math.min(totalSections - 1, prev + 1));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">Daily Snapshots</h2>
          <p className="text-muted-foreground text-sm">
            Capture your vibe each day
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
      
      <div className="grid grid-cols-6 gap-3 mb-4">
        {currentSlots.map(({ index, snapshot }) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (index % SNAPSHOTS_PER_PAGE) * 0.01 }}
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
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-0.5">
                  <p className="text-white text-[8px] text-center">
                    {new Date(snapshot.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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

      {/* Section navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={goToPreviousSection}
          disabled={currentSection === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground">
          Section {currentSection + 1} of {totalSections}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={goToNextSection}
          disabled={currentSection === totalSections - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

export default Snapshots;

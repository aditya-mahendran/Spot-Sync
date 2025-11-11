import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

interface MoodBoardImage {
  url: string;
  thumb: string;
  description: string;
  searchTerm: string;
  photographer: string;
  photographerUrl: string;
}

interface MoodBoardProps {
  images: MoodBoardImage[];
}

const MoodBoard = ({ images }: MoodBoardProps) => {
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-2">Your Music Mood Board</h2>
      <p className="text-muted-foreground mb-4">
        Visual vibes inspired by your listening habits
      </p>
      <div className="grid grid-cols-4 gap-0">
        {images.slice(0, 12).map((image, index) => (
          <div key={index} className="overflow-hidden aspect-square">
            <img
              src={image.url}
              alt={image.description}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MoodBoard;

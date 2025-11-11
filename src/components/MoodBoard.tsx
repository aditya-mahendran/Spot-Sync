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
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group overflow-hidden rounded-lg aspect-video">
            <img
              src={image.url}
              alt={image.description}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
              <p className="text-white text-sm font-medium mb-1">{image.searchTerm}</p>
              <a
                href={image.photographerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 text-xs flex items-center gap-1 hover:text-white transition-colors"
              >
                Photo by {image.photographer}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default MoodBoard;

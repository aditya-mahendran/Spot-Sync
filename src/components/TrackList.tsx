import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface TrackListProps {
  tracks: Track[];
  isLoading: boolean;
}

export const TrackList = ({ tracks, isLoading }: TrackListProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="p-4 bg-card border-border">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        No tracks found. Connect to Spotify to see your top tracks!
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in-50 duration-500">
      <h2 className="text-2xl font-bold mb-6">Your Top 5 Tracks</h2>
      {tracks.map((track, index) => (
        <Card
          key={track.id}
          className="group p-4 bg-card border-border hover:bg-card/80 transition-all duration-300 hover:shadow-[0_8px_32px_hsl(var(--primary)/0.2)] cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-muted-foreground w-8">
              {index + 1}
            </div>
            <img
              src={track.album.images[0]?.url}
              alt={track.album.name}
              className="w-16 h-16 rounded shadow-lg group-hover:scale-105 transition-transform duration-300"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {track.name}
              </h3>
              <p className="text-muted-foreground truncate">
                {track.artists.map((artist) => artist.name).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground/70 truncate">
                {track.album.name}
              </p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WeeklyListeningProps {
  description: string;
  vibeWord: string;
  vibeColor: string;
  isLoading: boolean;
  topGenres: string[];
  topArtists: string[];
  energyLevel: number;
  snapshotImageUrls?: string[];
}

const WeeklyListening = ({ 
  description, 
  vibeWord, 
  vibeColor, 
  isLoading,
  topGenres,
  topArtists,
  energyLevel,
  snapshotImageUrls
}: WeeklyListeningProps) => {
  
  const handleShare = async () => {
    try {
      toast.loading("Generating share image...");
      
      // Generate AI caption
      const { data: captionData, error: captionError } = await supabase.functions.invoke(
        'generate-instagram-caption',
        {
          body: { topGenres, topArtists, energyLevel }
        }
      );

      if (captionError) throw captionError;
      const caption = captionData.caption;

      // Create canvas for Instagram story (1080x1920)
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
      gradient.addColorStop(0, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f1e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // Add collage of up to 12 images (3x4)
      if (snapshotImageUrls && snapshotImageUrls.length > 0) {
        try {
          const urls = snapshotImageUrls.slice(0, 12);

          // Helper to load an image from an object URL
          const loadImg = (url: string) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const i = new Image();
              i.onload = () => resolve(i);
              i.onerror = reject;
              i.src = url;
            });

          // Fetch blobs to avoid CORS issues and create Image objects
          const objectUrls: string[] = [];
          const images: HTMLImageElement[] = [];

          for (const u of urls) {
            try {
              const resp = await fetch(u);
              const blob = await resp.blob();
              const objUrl = URL.createObjectURL(blob);
              objectUrls.push(objUrl);
              const img = await loadImg(objUrl);
              images.push(img);
            } catch (e) {
              console.warn('Skipping image due to load error:', e);
            }
          }

          // Draw 3 rows x 4 columns grid centered with margins
          const cols = 4;
          const rows = 3;
          const marginX = 60;
          const startY = 420;
          const availableWidth = canvas.width - marginX * 2; // 960px
          const cellW = Math.floor(availableWidth / cols);   // 240px
          const cellH = cellW; // square cells look good for a collage
          const collageW = cellW * cols;
          const collageH = cellH * rows;
          const startX = Math.floor((canvas.width - collageW) / 2);

          images.forEach((img, idx) => {
            const r = Math.floor(idx / cols);
            const c = idx % cols;
            if (r >= rows) return; // only draw first 12
            const x = startX + c * cellW;
            const y = startY + r * cellH;
            ctx.drawImage(img, x, y, cellW, cellH);
          });

          // Add color tint overlay using globalAlpha for compatibility with HSL
          ctx.save();
          ctx.fillStyle = vibeColor;
          ctx.globalAlpha = 0.25;
          ctx.fillRect(startX, startY, collageW, collageH);
          ctx.restore();

          // Cleanup object URLs
          objectUrls.forEach((o) => URL.revokeObjectURL(o));
        } catch (error) {
          console.error('Error building collage:', error);
        }
      }

      // Add caption text
      ctx.fillStyle = vibeColor;
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(caption, 540, 1500);

      // Add vibe word
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.fillText(`✨ ${vibeWord} ✨`, 540, 1600);

      // Convert to blob and share/download
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error('Failed to create image');
        
        const file = new File([blob], 'music-vibe.png', { type: 'image/png' });
        
        // Try Web Share API first (works on mobile)
        if (navigator.share && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'My Music Vibe',
            text: caption,
          });
        } else {
          // Fallback: download the image
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'music-vibe-story.png';
          a.click();
          URL.revokeObjectURL(url);
          toast.success('Image downloaded! Upload to Instagram Stories.');
        }
        
        toast.dismiss();
      }, 'image/png');
      
    } catch (error) {
      console.error('Share error:', error);
      toast.dismiss();
      toast.error('Failed to create share image');
    }
  };
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-cosmic-purple/10 via-background to-cosmic-pink/10 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold">What You Listened To This Week</h2>
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
        </div>
      </Card>
    );
  }

  if (!description) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-cosmic-purple/10 via-background to-cosmic-pink/10 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" style={{ color: vibeColor }} />
            </motion.div>
            <h2 className="text-2xl font-bold">What You Listened To This Week</h2>
          </div>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Share2 className="w-4 h-4" />
            Share to Stories
          </Button>
        </div>
        
        <motion.p
          className="text-muted-foreground leading-relaxed mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {description}
        </motion.p>

        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="text-sm text-muted-foreground">Overall vibe:</span>
          <motion.span
            className="text-2xl font-bold"
            style={{ color: vibeColor }}
            animate={{
              textShadow: [
                `0 0 10px ${vibeColor}40`,
                `0 0 20px ${vibeColor}60`,
                `0 0 10px ${vibeColor}40`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {vibeWord}
          </motion.span>
        </motion.div>
      </motion.div>
    </Card>
  );
};

export default WeeklyListening;

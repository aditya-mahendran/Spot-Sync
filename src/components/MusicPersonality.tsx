import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface MusicPersonalityProps {
  personality: string;
  isLoading: boolean;
}

export const MusicPersonality = ({ personality, isLoading }: MusicPersonalityProps) => {
  if (isLoading) {
    return (
      <Card className="w-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Your Music Personality
          </CardTitle>
          <CardDescription>AI is analyzing your vibes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-primary/10 rounded animate-pulse" />
            <div className="h-4 bg-primary/10 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-primary/10 rounded animate-pulse w-4/6" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!personality) return null;

  // Split personality into lines
  const lines = personality.split("\n").filter(line => line.trim());

  return (
    <Card className="w-full bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          Your Music Personality
        </CardTitle>
        <CardDescription>According to your listening habits</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lines.map((line, index) => (
            <p key={index} className="text-lg font-medium leading-relaxed">
              {line.replace(/^\d+\.\s*/, "").trim()}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

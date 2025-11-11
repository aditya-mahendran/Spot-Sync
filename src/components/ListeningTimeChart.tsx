import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

interface ListeningTimeChartProps {
  recentTracks: any[];
}

export const ListeningTimeChart = ({ recentTracks }: ListeningTimeChartProps) => {
  // Process the data to get hourly listening patterns
  const processListeningData = () => {
    const hourCounts: { [key: number]: number } = {};
    
    // Initialize all hours with 0
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }
    
    // Count tracks per hour
    recentTracks.forEach((track) => {
      if (track.played_at) {
        const date = new Date(track.played_at);
        const hour = date.getHours();
        hourCounts[hour]++;
      }
    });
    
    // Convert to chart data format
    return Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count,
      label: `${hour.toString().padStart(2, '0')}:00`,
    }));
  };
  
  const chartData = processListeningData();
  const totalTracks = recentTracks.length;
  const avgPerHour = (totalTracks / 24).toFixed(1);
  
  // Find peak listening hour
  const peakHour = chartData.reduce((max, item) => 
    item.count > max.count ? item : max, chartData[0]
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Listening Patterns</CardTitle>
        <CardDescription>
          Average daily listening times based on {totalTracks} recent tracks
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-primary/10">
            <p className="text-sm text-muted-foreground">Peak Hour</p>
            <p className="text-2xl font-bold text-primary">{peakHour.label}</p>
          </div>
          <div className="p-4 rounded-lg bg-primary/10">
            <p className="text-sm text-muted-foreground">Avg Per Hour</p>
            <p className="text-2xl font-bold text-primary">{avgPerHour}</p>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="hour" 
              tickFormatter={(hour) => `${hour}:00`}
              label={{ value: 'Hour of Day', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              label={{ value: 'Tracks Played', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: any) => [`${value} tracks`, 'Count']}
              labelFormatter={(hour) => `${hour}:00`}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from "recharts";

interface ListeningTimeChartProps {
  recentTracks: any[];
}

export const ListeningTimeChart = ({ recentTracks }: ListeningTimeChartProps) => {
  // Convert 24h to 12h format with AM/PM
  const formatTimeAMPM = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

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
      label: formatTimeAMPM(parseInt(hour)),
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
        
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <XAxis 
              dataKey="hour" 
              tickFormatter={formatTimeAMPM}
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value: any) => [`${value} tracks`, 'Count']}
              labelFormatter={(hour) => formatTimeAMPM(hour)}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

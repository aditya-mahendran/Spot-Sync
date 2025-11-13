import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { motion } from "framer-motion";

interface GenreChartProps {
  genreStats: Array<{ genre: string; count: number }>;
}

export const GenreChart = ({ genreStats }: GenreChartProps) => {
  // Take top 15 genres for better visualization
  const topGenres = genreStats.slice(0, 15);

  // Generate colors based on index
  const getColor = (index: number) => {
    const hue = (index * 360) / topGenres.length;
    return `hsl(${hue}, 70%, 60%)`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full max-w-6xl mx-auto px-4 py-8"
    >
      <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
        <h2 className="text-2xl font-bold mb-6 text-center text-foreground">
          Your Genre Distribution
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Top {topGenres.length} genres from your listening history
        </p>
        
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={topGenres}
            margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis
              dataKey="genre"
              angle={-45}
              textAnchor="end"
              height={100}
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
              label={{ value: "Count", angle: -90, position: "insideLeft", fill: "hsl(var(--foreground))" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                color: "hsl(var(--foreground))",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]}>
              {topGenres.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(index)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

import { SimulationMetrics } from "@shared/schema";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

interface CpuChartProps {
  data: SimulationMetrics[];
}

export function CpuChart({ data }: CpuChartProps) {
  // Format data for chart
  const chartData = data.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' }),
    cpu: d.cpuUtilization,
    wait: d.averageWaitTime,
    fullTimestamp: d.timestamp
  }));

  if (data.length < 2) {
    return (
      <Card className="glass-panel h-[300px] flex items-center justify-center text-muted-foreground/50 border-dashed">
        Waiting for metrics...
      </Card>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 rounded-2xl h-[300px] flex flex-col"
    >
      <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">CPU Utilization Trend</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              fontSize={10} 
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(10, 10, 20, 0.9)', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="cpu" 
              stroke="#7c3aed" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorCpu)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  delay?: number;
}

export function MetricCard({ title, value, icon, trend, trendValue, className, delay = 0 }: MetricCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={cn("glass-card p-6 rounded-2xl relative overflow-hidden group", className)}
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-primary scale-150 transform group-hover:scale-125 duration-500">
        {icon}
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center space-x-2 text-muted-foreground mb-2">
          <div className="p-1.5 rounded-md bg-white/5 border border-white/10">
            {icon}
          </div>
          <span className="text-sm font-medium">{title}</span>
        </div>
        
        <div className="flex items-end justify-between">
          <h3 className="text-3xl font-bold font-mono tracking-tighter text-foreground">
            {value}
          </h3>
          {trend && (
            <div className={cn(
              "text-xs font-medium px-2 py-1 rounded-full border",
              trend === "up" ? "bg-green-500/10 text-green-400 border-green-500/20" : 
              trend === "down" ? "bg-red-500/10 text-red-400 border-red-500/20" : 
              "bg-gray-500/10 text-gray-400 border-gray-500/20"
            )}>
              {trendValue}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

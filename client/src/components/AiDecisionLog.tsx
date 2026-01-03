import { AiDecisionLog } from "@shared/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { BrainCircuit, TrendingUp, Activity, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AiDecisionLogProps {
  logs: AiDecisionLog[];
}

export function AiLogPanel({ logs }: AiDecisionLogProps) {
  return (
    <div className="glass-panel rounded-2xl flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-xl">
        <BrainCircuit className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-lg">AI Optimization Log</h3>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground text-sm py-8 opacity-50">
                AI is monitoring process behavior...
              </div>
            ) : (
              logs.map((log) => (
                <AiLogItem key={log.id} log={log} />
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

function AiLogItem({ log }: { log: AiDecisionLog }) {
  const getActionIcon = () => {
    switch (log.action) {
      case 'boost': return <TrendingUp className="w-4 h-4 text-purple-400" />;
      case 'normalize': return <Activity className="w-4 h-4 text-blue-400" />;
      default: return <ShieldCheck className="w-4 h-4 text-green-400" />;
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="relative pl-6 pb-2 border-l border-white/10 last:border-0"
    >
      <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-background border-2 border-purple-500/50" />
      
      <div className="bg-white/5 rounded-lg p-3 border border-white/5 hover:bg-white/10 transition-colors">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {getActionIcon()}
            <span className="font-bold text-xs uppercase tracking-wider text-purple-300">
              {log.action}
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">
            {format(new Date(log.timestamp), "HH:mm:ss.SSS")}
          </span>
        </div>
        
        <p className="text-sm text-foreground/90 mb-2">
          {log.reason} <span className="text-muted-foreground">for</span> <span className="font-mono text-xs bg-black/30 px-1 py-0.5 rounded text-white/80">{log.processName}</span>
        </p>
        
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-black/20 p-1.5 rounded">
          <span>Confidence: <span className="text-green-400 font-mono">{(log.confidence * 100).toFixed(0)}%</span></span>
          <span className="w-px h-3 bg-white/10" />
          <span>Wait Ratio: <span className="text-orange-400 font-mono">{log.features.waitRatio.toFixed(2)}</span></span>
        </div>
      </div>
    </motion.div>
  );
}

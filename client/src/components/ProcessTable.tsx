import { Process } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Zap, AlertTriangle, Clock, CheckCircle2, Play } from "lucide-react";

interface ProcessTableProps {
  processes: Process[];
}

export function ProcessTable({ processes }: ProcessTableProps) {
  // Sort processes by priority (higher priority first) for visual hierarchy if needed, 
  // or keep them stable by PID. Let's keep them stable by PID usually, 
  // but maybe group by state. For now, flat list sorted by PID.
  const sortedProcesses = [...processes].sort((a, b) => a.pid - b.pid);

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between sticky top-0 z-10 backdrop-blur-xl">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"/>
          Live Process Queue
        </h3>
        <Badge variant="outline" className="bg-black/20 font-mono text-xs">
          {processes.filter(p => p.state === 'running' || p.state === 'ready').length} Active
        </Badge>
      </div>
      
      <div className="flex-1 overflow-auto p-2 space-y-2 custom-scrollbar">
        <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="col-span-1">PID</div>
          <div className="col-span-3">Name</div>
          <div className="col-span-2">Priority</div>
          <div className="col-span-2">State</div>
          <div className="col-span-2">Progress</div>
          <div className="col-span-2 text-right">Flags</div>
        </div>

        <AnimatePresence mode="popLayout">
          {sortedProcesses.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-64 text-muted-foreground"
            >
              <div className="p-4 rounded-full bg-white/5 mb-4">
                <Clock className="w-8 h-8 opacity-50" />
              </div>
              <p>No processes initialized</p>
            </motion.div>
          ) : (
            sortedProcesses.map((process) => (
              <ProcessRow key={process.pid} process={process} />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProcessRow({ process }: { process: Process }) {
  const getStatusColor = (state: Process['state']) => {
    switch (state) {
      case 'running': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'ready': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'waiting': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'terminated': return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (state: Process['state']) => {
    switch (state) {
      case 'running': return <Play className="w-3 h-3 mr-1" />;
      case 'ready': return <Clock className="w-3 h-3 mr-1" />;
      case 'waiting': return <Clock className="w-3 h-3 mr-1" />;
      case 'terminated': return <CheckCircle2 className="w-3 h-3 mr-1" />;
    }
  };

  const progress = Math.min(100, Math.max(0, ((process.burstTime - process.remainingTime) / process.burstTime) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        backgroundColor: process.state === 'running' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0,0,0,0)',
        borderColor: process.boosted ? 'rgba(168, 85, 247, 0.4)' : 'rgba(255, 255, 255, 0.05)'
      }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "grid grid-cols-12 gap-4 items-center p-3 rounded-lg border text-sm hover:bg-white/5 transition-colors group",
        process.boosted && "shadow-[0_0_15px_-5px_rgba(168,85,247,0.3)]"
      )}
    >
      <div className="col-span-1 font-mono text-xs opacity-70">#{process.pid}</div>
      
      <div className="col-span-3 font-medium flex items-center gap-2">
        <div 
          className="w-2 h-2 rounded-full shadow-[0_0_8px]" 
          style={{ backgroundColor: process.color, boxShadow: `0 0 8px ${process.color}` }}
        />
        <span className="truncate">{process.name}</span>
      </div>

      <div className="col-span-2 flex items-center gap-2">
        <div className="flex flex-col">
          <span className={cn("font-bold font-mono", process.boosted ? "text-purple-400" : "text-foreground")}>
            {process.priority}
          </span>
          {process.priority !== process.basePriority && (
            <span className="text-[10px] text-muted-foreground line-through">
              {process.basePriority}
            </span>
          )}
        </div>
        {process.boosted && (
          <Zap className="w-3 h-3 text-purple-400 animate-pulse" />
        )}
      </div>

      <div className="col-span-2">
        <Badge variant="outline" className={cn("text-xs font-normal capitalize pl-1 pr-2 py-0 h-6 border", getStatusColor(process.state))}>
          {getStatusIcon(process.state)}
          {process.state}
        </Badge>
      </div>

      <div className="col-span-2 flex flex-col gap-1 justify-center">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>{process.remainingTime}s left</span>
        </div>
        <Progress value={progress} className="h-1.5 bg-white/10" indicatorClassName={process.state === 'running' ? 'bg-primary' : 'bg-muted-foreground'} />
      </div>

      <div className="col-span-2 flex justify-end items-center gap-2">
        {process.isStarving && (
          <TooltipWrapper text="Process is starving due to low priority">
            <Badge variant="destructive" className="h-6 w-6 p-0 flex items-center justify-center rounded-full animate-pulse">
              <AlertTriangle className="w-3 h-3" />
            </Badge>
          </TooltipWrapper>
        )}
      </div>
    </motion.div>
  );
}

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

function TooltipWrapper({ children, text }: { children: ReactNode; text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="bg-popover border-border text-xs">
        <p>{text}</p>
      </TooltipContent>
    </Tooltip>
  );
}

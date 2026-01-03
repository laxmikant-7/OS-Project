import { useState } from "react";
import { useSimulationSocket, useSimulationControl } from "@/hooks/use-simulation";
import { MetricCard } from "@/components/MetricCard";
import { ProcessTable } from "@/components/ProcessTable";
import { AiLogPanel } from "@/components/AiDecisionLog";
import { CpuChart } from "@/components/CpuChart";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Square, 
  Cpu, 
  Activity, 
  Clock, 
  Layers,
  RotateCcw,
  Settings2
} from "lucide-react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { isConnected, state } = useSimulationSocket();
  const { startSimulation, stopSimulation, isStarting, isStopping, clearSimulation, isClearing } = useSimulationControl();
  
  const [config, setConfig] = useState({
    processCount: 10,
    algorithm: 'ai-boost' as const,
    speed: 1.0
  });

  const [dialogOpen, setDialogOpen] = useState(false);

  const handleStart = () => {
    startSimulation(config, {
      onSuccess: () => {
        setDialogOpen(false);
        toast({
          title: "Simulation Started",
          description: `Running with ${config.processCount} processes using ${config.algorithm} algorithm.`,
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Failed to start",
          description: err.message
        });
      }
    });
  };

  const handleStop = () => {
    stopSimulation(undefined, {
      onSuccess: () => {
        toast({ title: "Simulation Stopped" });
      }
    });
  };

  const handleClear = () => {
      clearSimulation(undefined, {
          onSuccess: () => {
              toast({ title: "Simulation Cleared", description: "All data reset." });
          }
      })
  }

  // Get latest metrics
  const latestMetrics = state.metrics[state.metrics.length - 1] || {
    cpuUtilization: 0,
    activeProcesses: 0,
    averageWaitTime: 0,
    throughput: 0,
    starvationCount: 0
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 space-y-8 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Neuromorphic Scheduler
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`} />
            {isConnected ? 'System Online' : 'Connecting to Core...'}
            <span className="mx-2 text-white/20">|</span>
            <span className="font-mono text-xs opacity-70">AI-Optimized Process Management v1.0</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
            <Button 
                variant="outline"
                size="icon"
                onClick={handleClear}
                disabled={isClearing || state.isRunning}
                className="border-white/10 hover:bg-white/5"
            >
                <RotateCcw className="w-4 h-4" />
            </Button>
            
            {state.isRunning ? (
                <Button 
                variant="destructive" 
                onClick={handleStop}
                disabled={isStopping}
                className="shadow-lg shadow-red-500/20"
                >
                <Square className="w-4 h-4 mr-2 fill-current" />
                Stop Simulation
                </Button>
            ) : (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button 
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25"
                    >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Initialize Run
                    </Button>
                </DialogTrigger>
                <DialogContent className="glass-panel border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Simulation Configuration</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                    <div className="space-y-2">
                        <Label>Process Count ({config.processCount})</Label>
                        <Slider 
                        value={[config.processCount]} 
                        min={1} 
                        max={20} 
                        step={1}
                        onValueChange={([v]) => setConfig(prev => ({ ...prev, processCount: v }))}
                        className="py-4"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Scheduling Algorithm</Label>
                        <Select 
                        value={config.algorithm} 
                        onValueChange={(v: any) => setConfig(prev => ({ ...prev, algorithm: v }))}
                        >
                        <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="rr">Round Robin (Standard)</SelectItem>
                            <SelectItem value="priority">Priority Queue (Static)</SelectItem>
                            <SelectItem value="ai-boost">AI-Optimized Dynamic Priority</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Simulation Speed ({config.speed}x)</Label>
                        <Slider 
                        value={[config.speed]} 
                        min={0.1} 
                        max={5.0} 
                        step={0.1}
                        onValueChange={([v]) => setConfig(prev => ({ ...prev, speed: v }))}
                        className="py-4"
                        />
                    </div>
                    </div>
                    <Button onClick={handleStart} disabled={isStarting} className="w-full bg-primary hover:bg-primary/90">
                    {isStarting ? "Initializing..." : "Start Simulation"}
                    </Button>
                </DialogContent>
                </Dialog>
            )}
        </div>
      </header>

      {/* METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard 
          title="CPU Utilization" 
          value={`${Math.round(latestMetrics.cpuUtilization)}%`}
          icon={<Cpu className="w-6 h-6" />}
          trend={latestMetrics.cpuUtilization > 80 ? 'up' : 'neutral'}
          trendValue="High Load"
          delay={1}
          className="border-l-4 border-l-primary"
        />
        <MetricCard 
          title="Avg Wait Time" 
          value={`${latestMetrics.averageWaitTime.toFixed(1)}s`}
          icon={<Clock className="w-6 h-6" />}
          delay={2}
          className="border-l-4 border-l-blue-500"
        />
        <MetricCard 
          title="Active Processes" 
          value={latestMetrics.activeProcesses}
          icon={<Layers className="w-6 h-6" />}
          delay={3}
          className="border-l-4 border-l-cyan-500"
        />
        <MetricCard 
          title="Throughput" 
          value={latestMetrics.throughput.toFixed(2)}
          icon={<Activity className="w-6 h-6" />}
          delay={4}
          className="border-l-4 border-l-emerald-500"
        />
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Left: Process Table */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ProcessTable processes={state.processes} />
          </motion.div>
          
          <CpuChart data={state.metrics} />
        </div>

        {/* Right: AI Log */}
        <div className="lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <AiLogPanel logs={state.aiLogs} />
          </motion.div>

          <div className="mt-6 glass-panel p-6 rounded-2xl">
              <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  System Parameters
              </h3>
              <div className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                      <span>Algorithm</span>
                      <span className="text-foreground font-mono bg-white/5 px-2 rounded">{config.algorithm}</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Speed</span>
                      <span className="text-foreground font-mono">{config.speed}x</span>
                  </div>
                  <div className="flex justify-between">
                      <span>Starvation Events</span>
                      <span className="text-red-400 font-bold">{latestMetrics.starvationCount}</span>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

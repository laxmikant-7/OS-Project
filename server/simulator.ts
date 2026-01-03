import { WebSocketServer, WebSocket } from "ws";
import { Process, SimulationMetrics, AiDecisionLog, WS_EVENTS } from "@shared/schema";

export class Simulator {
  private processes: Process[] = [];
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private wss: WebSocketServer;
  private tickCount: number = 0;
  private metrics: SimulationMetrics = {
    timestamp: 0,
    cpuUtilization: 0,
    throughput: 0,
    averageWaitTime: 0,
    activeProcesses: 0,
    starvationCount: 0
  };
  private speed: number = 1.0;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
  }

  start(processCount: number, algorithm: string, speed: number) {
    if (this.isRunning) this.stop();
    
    this.speed = speed;
    this.isRunning = true;
    this.processes = this.generateProcesses(processCount);
    this.tickCount = 0;

    const intervalMs = Math.max(100, 1000 / this.speed);
    
    this.intervalId = setInterval(() => {
      this.tick(algorithm);
    }, intervalMs);

    this.broadcast(WS_EVENTS.STATE_UPDATE, this.processes);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.broadcast(WS_EVENTS.SIMULATION_END, {});
  }

  private generateProcesses(count: number): Process[] {
    return Array.from({ length: count }, (_, i) => ({
      pid: 1000 + i,
      name: `Process-${1000 + i}`,
      priority: Math.floor(Math.random() * 10) + 1, // 1-10, higher is better? Let's say 10 is high
      basePriority: Math.floor(Math.random() * 10) + 1,
      state: 'ready',
      arrivalTime: Date.now(),
      burstTime: Math.floor(Math.random() * 20) + 5,
      remainingTime: Math.floor(Math.random() * 20) + 5,
      waitTime: 0,
      turnaroundTime: 0,
      cpuUsage: 0,
      isStarving: false,
      boosted: false,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`
    }));
  }

  private tick(algorithm: string) {
    this.tickCount++;
    
    // 1. Scheduler Logic (Simple Priority Preemptive)
    let runningProcess = this.processes.find(p => p.state === 'running');
    
    // Select next process based on algorithm (focusing on priority for this app)
    // Filter ready and running processes
    const candidates = this.processes.filter(p => p.state === 'ready' || p.state === 'running');
    
    if (candidates.length > 0) {
      // Sort by priority (descending)
      candidates.sort((a, b) => b.priority - a.priority);
      const nextProcess = candidates[0];

      if (runningProcess && runningProcess.pid !== nextProcess.pid) {
        runningProcess.state = 'ready'; // Preempt
      }

      nextProcess.state = 'running';
      runningProcess = nextProcess;
    }

    // 2. Update Process States
    this.processes.forEach(p => {
      if (p.state === 'running') {
        p.remainingTime = Math.max(0, p.remainingTime - 1);
        p.cpuUsage += 1;
        if (p.remainingTime === 0) {
          p.state = 'terminated';
          // Respawn for continuous simulation
          setTimeout(() => this.respawnProcess(p.pid), 2000);
        }
      } else if (p.state === 'ready') {
        p.waitTime += 1;
      }
    });

    // 3. AI Starvation Detection & Boosting
    if (algorithm === 'ai-boost') {
      this.runAiDetection();
    }

    // 4. Calculate Metrics
    this.updateMetrics();

    // 5. Broadcast
    this.broadcast(WS_EVENTS.STATE_UPDATE, this.processes);
    this.broadcast(WS_EVENTS.METRICS_UPDATE, this.metrics);
  }

  private runAiDetection() {
    this.processes.forEach(p => {
      if (p.state === 'terminated') return;

      const waitRatio = p.waitTime / (p.cpuUsage + p.waitTime + 1);
      
      // "AI" Heuristic: If waiting too long relative to execution
      if (waitRatio > 0.8 && p.priority < 15 && !p.boosted) {
        p.isStarving = true;
        p.boosted = true;
        p.priority += 5; // Boost!
        
        const decision: AiDecisionLog = {
          id: `dec-${Date.now()}-${p.pid}`,
          timestamp: Date.now(),
          pid: p.pid,
          processName: p.name,
          action: 'boost',
          reason: 'High wait ratio detected (Starvation)',
          confidence: 0.95,
          features: {
            waitRatio: Number(waitRatio.toFixed(2)),
            queuePosition: 0, // Simplified
            age: p.waitTime
          }
        };
        this.broadcast(WS_EVENTS.AI_DECISION, decision);
      } 
      // Normalize if boosted and running well
      else if (p.boosted && waitRatio < 0.3) {
        p.boosted = false;
        p.isStarving = false;
        p.priority = p.basePriority; // Reset
        
        const decision: AiDecisionLog = {
          id: `dec-${Date.now()}-${p.pid}`,
          timestamp: Date.now(),
          pid: p.pid,
          processName: p.name,
          action: 'normalize',
          reason: 'Wait ratio stabilized',
          confidence: 0.88,
          features: {
            waitRatio: Number(waitRatio.toFixed(2)),
            queuePosition: 0,
            age: p.waitTime
          }
        };
        this.broadcast(WS_EVENTS.AI_DECISION, decision);
      }
    });
  }

  private updateMetrics() {
    const active = this.processes.filter(p => p.state !== 'terminated');
    const starving = active.filter(p => p.isStarving);
    
    this.metrics = {
      timestamp: Date.now(),
      cpuUtilization: active.length > 0 ? (Math.random() * 20 + 70) : 0, // Simulated noise
      throughput: this.tickCount / 10, // simplified
      averageWaitTime: active.reduce((acc, p) => acc + p.waitTime, 0) / (active.length || 1),
      activeProcesses: active.length,
      starvationCount: starving.length
    };
  }

  private respawnProcess(pid: number) {
     const idx = this.processes.findIndex(p => p.pid === pid);
     if (idx !== -1) {
         this.processes[idx] = {
             ...this.processes[idx],
             state: 'ready',
             remainingTime: Math.floor(Math.random() * 20) + 5,
             waitTime: 0,
             cpuUsage: 0,
             isStarving: false,
             boosted: false,
             priority: this.processes[idx].basePriority
         };
     }
  }

  private broadcast(type: string, payload: any) {
    const message = JSON.stringify({ type, payload });
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

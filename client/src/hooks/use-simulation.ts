import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useState, useEffect, useRef } from "react";
import { 
  Process, 
  SimulationMetrics, 
  AiDecisionLog, 
  WsMessage, 
  WS_EVENTS 
} from "@shared/schema";
import { z } from "zod";

// Types for WebSocket data state
interface SimulationState {
  processes: Process[];
  metrics: SimulationMetrics[];
  aiLogs: AiDecisionLog[];
  isRunning: boolean;
}

export function useSimulationSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [state, setState] = useState<SimulationState>({
    processes: [],
    metrics: [],
    aiLogs: [],
    isRunning: false,
  });

  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const connect = () => {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Simulation WebSocket");
        setIsConnected(true);
      };

      ws.onclose = () => {
        console.log("Disconnected from Simulation WebSocket");
        setIsConnected(false);
        // Attempt reconnect after 3s
        setTimeout(connect, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WsMessage;
          
          switch (message.type) {
            case WS_EVENTS.STATE_UPDATE:
              const processes = message.payload as Process[];
              setState(prev => ({ ...prev, processes, isRunning: true }));
              break;
              
            case WS_EVENTS.METRICS_UPDATE:
              const newMetrics = message.payload as SimulationMetrics;
              setState(prev => ({ 
                ...prev, 
                metrics: [...prev.metrics.slice(-19), newMetrics] // Keep last 20 points
              }));
              break;
              
            case WS_EVENTS.AI_DECISION:
              const newLog = message.payload as AiDecisionLog;
              setState(prev => ({ 
                ...prev, 
                aiLogs: [newLog, ...prev.aiLogs.slice(0, 49)] // Keep last 50 logs, newest first
              }));
              break;

            case WS_EVENTS.SIMULATION_END:
              setState(prev => ({ ...prev, isRunning: false }));
              break;
          }
        } catch (err) {
          console.error("Failed to parse WS message", err);
        }
      };
    };

    connect();

    return () => {
      socketRef.current?.close();
    };
  }, []);

  return { isConnected, state };
}

export function useSimulationControl() {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: async (params: z.infer<typeof api.simulation.start.input>) => {
      const res = await fetch(api.simulation.start.path, {
        method: api.simulation.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      
      if (!res.ok) throw new Error("Failed to start simulation");
      return api.simulation.start.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      // Invalidate history so the table updates when we stop
      queryClient.invalidateQueries({ queryKey: [api.simulation.history.path] });
    }
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(api.simulation.stop.path, {
        method: api.simulation.stop.method,
      });
      if (!res.ok) throw new Error("Failed to stop simulation");
      return api.simulation.stop.responses[200].parse(await res.json());
    },
  });

  const clearMutation = useMutation({
      mutationFn: async () => {
          const res = await fetch(api.simulation.clear.path, {
              method: api.simulation.clear.method
          });
          if (!res.ok) throw new Error("Failed to clear simulation");
          return api.simulation.clear.responses[200].parse(await res.json());
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [api.simulation.history.path] });
      }
  })

  return {
    startSimulation: startMutation.mutate,
    isStarting: startMutation.isPending,
    stopSimulation: stopMutation.mutate,
    isStopping: stopMutation.isPending,
    clearSimulation: clearMutation.mutate,
    isClearing: clearMutation.isPending
  };
}

export function useSimulationHistory() {
  return useQuery({
    queryKey: [api.simulation.history.path],
    queryFn: async () => {
      const res = await fetch(api.simulation.history.path);
      if (!res.ok) throw new Error("Failed to fetch history");
      return api.simulation.history.responses[200].parse(await res.json());
    },
  });
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { Simulator } from "./simulator";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const simulator = new Simulator(wss);

  app.post(api.simulation.start.path, (req, res) => {
    try {
      const { processCount, algorithm, speed } = api.simulation.start.input.parse(req.body);
      simulator.start(processCount, algorithm, speed);
      res.json({ message: "Simulation started", simulationId: "sim-" + Date.now() });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid input", errors: err.errors });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post(api.simulation.stop.path, (req, res) => {
    simulator.stop();
    res.json({ message: "Simulation stopped" });
  });

  app.get(api.simulation.history.path, async (req, res) => {
    const history = await storage.getSimulationHistory();
    res.json(history);
  });
  
  app.post(api.simulation.clear.path, async (req, res) => {
      await storage.clearHistory();
      res.json({ message: "History cleared" });
  });

  return httpServer;
}

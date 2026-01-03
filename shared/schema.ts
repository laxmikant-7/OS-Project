import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
// We'll store simulation runs to keep a history
export const simulationRuns = pgTable("simulation_runs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  duration: integer("duration").notNull(), // in seconds
  processCount: integer("process_count").notNull(),
  starvationEvents: integer("starvation_events").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===
export const insertSimulationRunSchema = createInsertSchema(simulationRuns).omit({ id: true, createdAt: true });

// === TYPES ===
export type SimulationRun = typeof simulationRuns.$inferSelect;
export type InsertSimulationRun = z.infer<typeof insertSimulationRunSchema>;

// === SHARED SIMULATION TYPES (Not in DB, but shared) ===

export type ProcessState = 'ready' | 'running' | 'waiting' | 'terminated';

export interface Process {
  pid: number;
  name: string;
  priority: number;
  basePriority: number;
  state: ProcessState;
  arrivalTime: number;
  burstTime: number;
  remainingTime: number;
  waitTime: number;
  turnaroundTime: number;
  cpuUsage: number; // percentage or ticks
  isStarving: boolean;
  boosted: boolean;
  color: string;
}

export interface SimulationMetrics {
  timestamp: number;
  cpuUtilization: number;
  throughput: number;
  averageWaitTime: number;
  activeProcesses: number;
  starvationCount: number;
}

export interface AiDecisionLog {
  id: string;
  timestamp: number;
  pid: number;
  processName: string;
  action: 'boost' | 'normalize' | 'monitor';
  reason: string;
  confidence: number;
  features: {
    waitRatio: number;
    queuePosition: number;
    age: number;
  };
}

export const WS_EVENTS = {
  STATE_UPDATE: 'state_update',
  METRICS_UPDATE: 'metrics_update',
  AI_DECISION: 'ai_decision',
  SIMULATION_END: 'simulation_end'
} as const;

export interface WsMessage<T = unknown> {
  type: keyof typeof WS_EVENTS;
  payload: T;
}

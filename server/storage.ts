import { db } from "./db";
import {
  simulationRuns,
  type InsertSimulationRun,
  type SimulationRun
} from "@shared/schema";

export interface IStorage {
  logSimulationRun(run: InsertSimulationRun): Promise<SimulationRun>;
  getSimulationHistory(): Promise<SimulationRun[]>;
  clearHistory(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async logSimulationRun(run: InsertSimulationRun): Promise<SimulationRun> {
    const [result] = await db.insert(simulationRuns).values(run).returning();
    return result;
  }

  async getSimulationHistory(): Promise<SimulationRun[]> {
    return await db.select().from(simulationRuns).orderBy(simulationRuns.createdAt);
  }

  async clearHistory(): Promise<void> {
      await db.delete(simulationRuns);
  }
}

export const storage = new DatabaseStorage();

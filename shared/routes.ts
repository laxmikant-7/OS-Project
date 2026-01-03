import { z } from 'zod';
import { insertSimulationRunSchema, simulationRuns } from './schema';

export const api = {
  simulation: {
    start: {
      method: 'POST' as const,
      path: '/api/simulation/start',
      input: z.object({
        processCount: z.number().min(1).max(20).default(10),
        algorithm: z.enum(['rr', 'priority', 'ai-boost']).default('ai-boost'),
        speed: z.number().min(0.1).max(5.0).default(1.0)
      }),
      responses: {
        200: z.object({ message: z.string(), simulationId: z.string() })
      }
    },
    stop: {
      method: 'POST' as const,
      path: '/api/simulation/stop',
      responses: {
        200: z.object({ message: z.string() })
      }
    },
    history: {
      method: 'GET' as const,
      path: '/api/simulation/history',
      responses: {
        200: z.array(z.custom<typeof simulationRuns.$inferSelect>())
      }
    },
    clear: {
        method: 'POST' as const,
        path: '/api/simulation/clear',
        responses: {
            200: z.object({ message: z.string() })
        }
    }
  }
};

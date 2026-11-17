/** Durable poteto-workflow selection projected from Session events. */

import { z } from "zod";
import type { ProjectionDefinition } from "@deepseek-ai/dsh-session-projection";
import type { SessionEvent, SessionEventMap } from "@deepseek-ai/dsh-session";

declare module "@deepseek-ai/dsh-session" {
  interface SessionEventMap {
    "poteto/mode": { enabled: boolean };
  }
}

export interface PotetoProjectionState {
  readonly enabled?: boolean;
}

const stateSchema = z
  .object({ enabled: z.boolean().optional() })
  .strict() as z.ZodType<PotetoProjectionState>;
const eventSchema = z.object({ enabled: z.boolean() }).strict() as z.ZodType<
  SessionEventMap["poteto/mode"]
>;

/** Persisted selection for one root Session. */
export const potetoProjectionDefinition: ProjectionDefinition<"potetoMode", PotetoProjectionState> =
  {
    key: "potetoMode",
    stateVersion: 1,
    stateSchema,
    init: () => ({}),
    apply: (state: PotetoProjectionState, event: SessionEvent) =>
      event.type === "poteto/mode" ? { ...state, ...eventSchema.parse(event.data) } : state,
  };

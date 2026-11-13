import type { Phase } from "./types.ts";

export interface Capability {
  id: string;
  description: string;
  /** Source of the requirement: pstack usage and/or the raw adapter mapping. */
  source: string;
  requiredBy: readonly string[];
  phases: readonly Phase[];
  /** Behavior scenario that probes this capability in the listed phases. */
  probe: string;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    id: "model.discovery",
    description:
      "Discover the providers, models, and reasoning efforts available to the session before choosing a route.",
    source: "pstack setup/setup-pstack usage; raw/dsh.md Models",
    requiredBy: ["setup-pstack"],
    phases: ["raw", "adapted"],
    probe: "capability-resource-routing",
  },
  {
    id: "role.catalog",
    description:
      "Discover available roles and whether a role accepts one route, a list, or an automatic panel.",
    source: "pstack role usage; raw/dsh.md Models/subagent mapping",
    requiredBy: ["poteto-mode", "setup-pstack"],
    phases: ["raw", "adapted"],
    probe: "capability-resource-routing",
  },
  {
    id: "role.routing",
    description: "Route a child to a role with the role's configured provider, model, and effort.",
    source: "pstack playbooks and skills that delegate by role",
    requiredBy: ["poteto-mode", "orchestrate"],
    phases: ["adapted"],
    probe: "capability-resource-routing",
  },
  {
    id: "delegation.subagent",
    description:
      "Start a fresh child agent, pass a self-contained brief, and receive its result without polling.",
    source: "pstack Task usage; raw/dsh.md Tools/Subagent fields",
    requiredBy: ["poteto-mode", "orchestrate", "swarm"],
    phases: ["raw", "adapted"],
    probe: "capability-resource-routing",
  },
  {
    id: "delegation.model-effort",
    description: "Choose or inherit the child provider, model, and reasoning effort.",
    source: "pstack Task/model usage; raw/dsh.md Subagent fields/Models",
    requiredBy: ["poteto-mode", "swarm"],
    phases: ["raw", "adapted"],
    probe: "capability-resource-routing",
  },
  {
    id: "nontext.output",
    description: "Require a non-text output and verify its actual rendered or playable result.",
    source: "pstack skills that request images, diagrams, or video",
    requiredBy: ["ketchup", "ketchup-video", "statechart"],
    phases: ["raw", "adapted"],
    probe: "ketchup-recap-visual",
  },
];

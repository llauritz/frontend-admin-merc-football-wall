import type { TargetId } from "@/types";

// ==========================================
// TARGET DEFINITIONS
// Each target zone and its point value
// ==========================================

export interface TargetDefinition {
  id: TargetId;
  label: string;
  points: number;
}

/** All scoring targets on the football wall */
export const TARGETS: Record<TargetId, TargetDefinition> = {
  top_left: {
    id: "top_left",
    label: "Top Left",
    points: 50,
  },
  top_right: {
    id: "top_right",
    label: "Top Right",
    points: 50,
  },
  center: {
    id: "center",
    label: "Center",
    points: 100,
  },
  bottom_left: {
    id: "bottom_left",
    label: "Bottom Left",
    points: 30,
  },
  bottom_right: {
    id: "bottom_right",
    label: "Bottom Right",
    points: 30,
  },
};

/** Ordered list of targets for rendering in the UI */
export const TARGET_ORDER: TargetId[] = [
  "top_left",
  "top_right",
  "center",
  "bottom_left",
  "bottom_right",
];

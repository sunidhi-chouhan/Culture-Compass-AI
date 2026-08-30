/** Locked JourneyMind companion stages (Discover → Prepare). */
export const JOURNEY_STAGES = [
  "Discover",
  "Create",
  "Review",
  "Generate",
  "Explore",
  "Improve",
  "Prepare",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];

/** Stages with in-page anchors on the Explore workspace. */
export const EXPLORE_JUMP_STAGES = ["Explore", "Improve", "Prepare"] as const;

export type ExploreJumpStage = (typeof EXPLORE_JUMP_STAGES)[number];

export const EXPLORE_JUMP_HREFS: Record<ExploreJumpStage, string> = {
  Explore: "#explore-days",
  Improve: "#improve-tripmate",
  Prepare: "#prepare-packing",
};

/** Map planner chat step → stage label for the rail. */
export function plannerStepToStage(
  step: string,
  opts?: { generating?: boolean },
): JourneyStage {
  if (opts?.generating) return "Generate";
  if (step === "generate") return "Review";
  return "Create";
}

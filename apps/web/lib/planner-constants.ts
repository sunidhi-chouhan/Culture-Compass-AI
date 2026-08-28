import type { CompassPlanRequest, Location } from "@culturecompass/shared";
import { DEFAULT_MODEL_PRESET, DEFAULT_LENS_MODE, type LensMode } from "@culturecompass/shared";

export const PLANNER_INTERESTS = [
  "History",
  "Food",
  "Nature",
  "Festivals",
  "Architecture",
  "Photography",
  "Nightlife",
] as const;

export type PlannerInterest = (typeof PLANNER_INTERESTS)[number];

export const COMPANION_OPTIONS = ["Solo", "Couple", "Friends", "Family"] as const;
export type CompanionOption = (typeof COMPANION_OPTIONS)[number];

export const BUDGET_OPTIONS = [
  { id: "budget", label: "₹", description: "Budget-friendly" },
  { id: "moderate", label: "₹₹", description: "Comfortable" },
  { id: "premium", label: "₹₹₹", description: "Premium" },
  { id: "luxury", label: "Luxury", description: "No limits" },
] as const;

export type BudgetOption = (typeof BUDGET_OPTIONS)[number]["id"];

export const DURATION_OPTIONS = ["Weekend", "3 Days", "1 Week", "Custom"] as const;
export type DurationOption = (typeof DURATION_OPTIONS)[number];

export interface PlannerAnswers {
  destination: string;
  /** Resolved GeoNames location when user picks from search; null for free text or surprise. */
  destinationLocation: Location | null;
  interests: PlannerInterest[];
  companion: CompanionOption | null;
  budget: BudgetOption | null;
  duration: DurationOption | null;
  customDuration: string;
}

export const INITIAL_PLANNER_ANSWERS: PlannerAnswers = {
  destination: "",
  destinationLocation: null,
  interests: [],
  companion: null,
  budget: null,
  duration: null,
  customDuration: "",
};

const COMPANION_TO_STYLE: Record<CompanionOption, string> = {
  Solo: "solo",
  Couple: "relaxed",
  Friends: "adventurous",
  Family: "family",
};

const BUDGET_TO_LABEL: Record<BudgetOption, string> = {
  budget: "₹ Budget-friendly",
  moderate: "₹₹ Comfortable",
  premium: "₹₹₹ Premium",
  luxury: "Luxury",
};

const DURATION_TO_LABEL: Record<Exclude<DurationOption, "Custom">, string> = {
  Weekend: "Weekend (2–3 days)",
  "3 Days": "3 days",
  "1 Week": "1 week",
};

export function mapCompanionToTravelStyle(companion: CompanionOption): string {
  return COMPANION_TO_STYLE[companion];
}

export function mapBudgetToApiValue(budget: BudgetOption): string {
  return BUDGET_TO_LABEL[budget];
}

export function mapDurationToApiValue(
  duration: DurationOption,
  customDuration: string,
): string {
  if (duration === "Custom") {
    return customDuration.trim() || "5 days";
  }
  return DURATION_TO_LABEL[duration];
}

export function mapInterestsToApi(interests: PlannerInterest[]): string[] {
  return interests.map((i) => i.toLowerCase());
}

export function buildCompassPlanRequest(
  answers: PlannerAnswers,
  lensMode: LensMode = DEFAULT_LENS_MODE,
): CompassPlanRequest {
  if (!answers.companion || !answers.budget || !answers.duration) {
    throw new Error("Incomplete planner answers.");
  }
  if (answers.interests.length === 0) {
    throw new Error("Select at least one interest.");
  }

  const duration = mapDurationToApiValue(answers.duration, answers.customDuration);
  const notes = `Traveling as: ${answers.companion}.`;

  return {
    destination: answers.destination.trim() || undefined,
    interests: mapInterestsToApi(answers.interests),
    budget: mapBudgetToApiValue(answers.budget),
    duration,
    travelStyle: mapCompanionToTravelStyle(answers.companion),
    notes,
    modelPreset: DEFAULT_MODEL_PRESET,
    lensMode,
  };
}

export function formatUserAnswer(step: PlannerStep, answers: PlannerAnswers): string {
  switch (step) {
    case "destination":
      return answers.destination.trim() || "Surprise me — pick anywhere";
    case "interests":
      return answers.interests.join(", ");
    case "companions":
      return answers.companion ?? "";
    case "budget": {
      const opt = BUDGET_OPTIONS.find((b) => b.id === answers.budget);
      return opt ? `${opt.label} · ${opt.description}` : "";
    }
    case "duration":
      if (answers.duration === "Custom") {
        return answers.customDuration.trim() || "Custom duration";
      }
      return answers.duration ?? "";
    default:
      return "";
  }
}

export type PlannerStep =
  | "destination"
  | "interests"
  | "companions"
  | "budget"
  | "duration"
  | "generate";

export const PLANNER_STEPS: PlannerStep[] = [
  "destination",
  "interests",
  "companions",
  "budget",
  "duration",
  "generate",
];

export const ASSISTANT_PROMPTS: Record<Exclude<PlannerStep, "generate">, string> = {
  destination: "Where do you want to explore?",
  interests: "What interests you? Pick everything that calls to you.",
  companions: "Who are you travelling with?",
  budget: "What kind of budget feels right?",
  duration: "How long do you have to wander?",
};

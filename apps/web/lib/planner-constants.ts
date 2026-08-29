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

export type EditablePlannerStep = Exclude<PlannerStep, "generate">;

export const ASSISTANT_PROMPTS: Record<EditablePlannerStep, string> = {
  destination: "Where is this journey headed?",
  interests: "What should shape the trip? Pick everything that matters.",
  companions: "Who are you travelling with?",
  budget: "What budget feels right for this trip?",
  duration: "How long do you have?",
};

export const EDIT_MODE_PROMPTS: Record<EditablePlannerStep, string> = {
  destination: "Let's update your destination. Where would you like to explore?",
  interests: "Let's update your interests. What would you like to explore?",
  companions: "Let's update who you're travelling with. Who is joining you?",
  budget: "Let's update your budget. What feels right for this trip?",
  duration: "Let's update your duration. How long do you have to wander?",
};

export function getEditModePrompt(step: EditablePlannerStep): string {
  return EDIT_MODE_PROMPTS[step];
}

export interface ReviewPreferenceItem {
  step: EditablePlannerStep;
  label: string;
  value: string;
}

export function getPreviousPlannerStep(step: PlannerStep): PlannerStep | null {
  const index = PLANNER_STEPS.indexOf(step);
  if (index <= 0) return null;
  return PLANNER_STEPS[index - 1];
}

export function getNextPlannerStep(step: PlannerStep): PlannerStep | null {
  const index = PLANNER_STEPS.indexOf(step);
  if (index < 0 || index >= PLANNER_STEPS.length - 1) return null;
  return PLANNER_STEPS[index + 1];
}

/** Keep chat through the target step's question and answer; drop later steps to avoid duplicates. */
export function trimMessagesToStep<T extends { id: string }>(
  messages: T[],
  targetStep: EditablePlannerStep,
): T[] {
  let cutIndex = -1;
  for (let i = 0; i < messages.length; i++) {
    const id = messages[i].id;
    if (id === `q-${targetStep}` || id.startsWith(`user-${targetStep}`)) {
      cutIndex = i;
    }
  }
  if (cutIndex === -1) return messages;
  return messages.slice(0, cutIndex + 1);
}

export function buildReviewPreferences(answers: PlannerAnswers): ReviewPreferenceItem[] {
  const budgetOption = BUDGET_OPTIONS.find((option) => option.id === answers.budget);
  const durationValue =
    answers.duration === "Custom"
      ? answers.customDuration.trim() || "Custom duration"
      : (answers.duration ?? "");

  return [
    {
      step: "destination",
      label: "Destination",
      value: answers.destination.trim() || "Surprise me — pick anywhere",
    },
    {
      step: "interests",
      label: "Interests",
      value: answers.interests.join(", "),
    },
    {
      step: "companions",
      label: "Travelling with",
      value: answers.companion ?? "",
    },
    {
      step: "budget",
      label: "Budget",
      value: budgetOption?.description ?? "",
    },
    {
      step: "duration",
      label: "Duration",
      value: durationValue,
    },
  ];
}

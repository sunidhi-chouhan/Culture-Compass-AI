import type { Location } from "@culturecompass/shared";
import {
  ASSISTANT_PROMPTS,
  INITIAL_PLANNER_ANSWERS,
  PLANNER_STEPS,
  formatUserAnswer,
  type PlannerAnswers,
  type PlannerStep,
} from "@/lib/planner-constants";
import { resolvePlannerLocation } from "@/lib/planner-location";

export interface PlannerChatMessage {
  id: string;
  role: "assistant" | "user";
  text: string;
}

export interface PlannerInitInput {
  initialDestination?: string;
  initialLocation?: Location | null;
  entryMode?: "create" | "improve";
  storage?: Pick<Storage, "getItem" | "removeItem"> | null;
}

export interface PlannerInitState {
  answers: PlannerAnswers;
  step: PlannerStep;
  messages: PlannerChatMessage[];
  destinationInput: string;
  destinationLocation: Location | null;
}

function welcomeMessage(entryMode: "create" | "improve"): PlannerChatMessage {
  if (entryMode === "improve") {
    return {
      id: "welcome",
      role: "assistant",
      text: "Hi, I'm JourneyMind. Tell me about the trip you already have in mind — we'll capture the essentials first, then help you improve the schedule.",
    };
  }

  return {
    id: "welcome",
    role: "assistant",
    text: "Hi, I'm JourneyMind — your travel companion. Let's turn what you know about this trip into a journey you can explore and refine.",
  };
}

function buildMessagesForSkippedDestination(
  answers: PlannerAnswers,
  entryMode: "create" | "improve",
): PlannerChatMessage[] {
  return [
    welcomeMessage(entryMode),
    {
      id: "q-destination",
      role: "assistant",
      text: ASSISTANT_PROMPTS.destination,
    },
    {
      id: "user-destination-init",
      role: "user",
      text: formatUserAnswer("destination", answers),
    },
    {
      id: "q-interests",
      role: "assistant",
      text: ASSISTANT_PROMPTS.interests,
    },
  ];
}

function buildMessagesForDestinationStep(entryMode: "create" | "improve"): PlannerChatMessage[] {
  return [
    welcomeMessage(entryMode),
    {
      id: "q-destination",
      role: "assistant",
      text: ASSISTANT_PROMPTS.destination,
    },
  ];
}

/**
 * Initializes planner state from landing handoff or direct /plan navigation.
 * Skips the destination step when a valid Location object is available.
 */
export function initializePlannerState(input: PlannerInitInput = {}): PlannerInitState {
  const initialDestination = input.initialDestination ?? "";
  const initialLocation = input.initialLocation ?? null;
  const entryMode = input.entryMode ?? "create";
  const resolved = resolvePlannerLocation(
    initialDestination,
    initialLocation,
    input.storage ?? null,
  );

  const answers: PlannerAnswers = {
    ...INITIAL_PLANNER_ANSWERS,
    destination: resolved.destination,
    destinationLocation: resolved.location,
  };

  if (resolved.location) {
    return {
      answers,
      step: "interests",
      messages: buildMessagesForSkippedDestination(answers, entryMode),
      destinationInput: resolved.location.displayLabel,
      destinationLocation: resolved.location,
    };
  }

  return {
    answers,
    step: "destination",
    messages: buildMessagesForDestinationStep(entryMode),
    destinationInput: resolved.destination,
    destinationLocation: null,
  };
}

export function getPlannerStepIndex(step: PlannerStep): number {
  return PLANNER_STEPS.indexOf(step);
}

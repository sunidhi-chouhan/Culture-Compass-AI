export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const MODEL_PRESETS = {
  /** Same flash family as balanced — gemini-2.0-flash is unavailable on many keys. */
  fast: "gemini-2.5-flash",
  balanced: "gemini-2.5-flash",
  quality: "gemini-2.5-flash",
} as const;

export type ModelPreset = keyof typeof MODEL_PRESETS;

export const DEFAULT_MODEL_PRESET: ModelPreset = "balanced";

export const MODEL_PRESET_OPTIONS: ReadonlyArray<{
  id: ModelPreset;
  label: string;
  description: string;
}> = [
  {
    id: "fast",
    label: "Fast",
    description: "Quick responses — best for demos and slow connections",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Better quality with moderate speed",
  },
  {
    id: "quality",
    label: "Quality",
    description: "Richest storytelling — may take longer",
  },
];

export const TRAVEL_STYLES = [
  "adventurous",
  "relaxed",
  "cultural",
  "foodie",
  "family",
  "solo",
  "luxury",
  "budget",
] as const;

export const INTEREST_TAGS = [
  "history",
  "art",
  "music",
  "food",
  "nature",
  "architecture",
  "festivals",
  "local-life",
  "spirituality",
  "nightlife",
] as const;

export const STORY_TONES = ["immersive", "historical", "poetic", "family-friendly"] as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AI_ERROR: "AI_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export { INPUT_LIMITS } from "./limits";
export {
  LENS_MODES,
  DEFAULT_LENS_MODE,
  LOCAL_LENS_LABEL,
  LENS_MODE_LABELS,
  LENS_MODE_DESCRIPTIONS,
  LOCAL_LENS_CATEGORIES,
  type LensMode,
} from "./lens";

import type { TripItinerary, ItinerarySlot } from "@culturecompass/shared";

/** Rubric weights for Schedule Quality Score (must sum to 100). */
export const SQS_WEIGHTS = {
  realism: 40,
  culturalFit: 30,
  completeness: 20,
  actionability: 10,
} as const;

export interface ScheduleQualityBreakdown {
  realism: number;
  culturalFit: number;
  completeness: number;
  actionability: number;
}

export interface ScheduleQualityResult {
  score: number;
  breakdown: ScheduleQualityBreakdown;
  notes: string[];
}

export interface ScoreScheduleInput {
  itinerary: TripItinerary;
  interests: string[];
  destination?: string;
  /** Expected day count for completeness (from duration). */
  expectedDays?: number;
}

const VAGUE_PATTERNS =
  /\b(paced stop|shaped around|balanced day|discovery|explore the area|various|something|activity)\b/i;

function interestTokens(interests: string[]): string[] {
  return interests
    .map((i) => i.toLowerCase().trim())
    .filter(Boolean);
}

function slotText(slot: ItinerarySlot): string {
  return [slot.title, slot.description, slot.placeName, ...(slot.tags ?? [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function parseTimeMinutes(label?: string): number | null {
  if (!label) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(label.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

function scoreRealism(itinerary: TripItinerary, notes: string[]): number {
  let deductions = 0;
  let tightBuffers = 0;
  let longGaps = 0;
  let overlaps = 0;
  let overloadedDays = 0;

  for (const day of itinerary.days) {
    const slots = day.slots;
    let dayMinutes = 0;

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const duration = slot.durationMinutes ?? 60;
      dayMinutes += duration;

      const travel = slot.travelMinutesToNext;
      if (travel != null && travel > 0 && travel < 15) {
        tightBuffers += 1;
      }
      if (travel != null && travel >= 45) {
        longGaps += 1;
      }

      const start = parseTimeMinutes(slot.timeLabel);
      const next = slots[i + 1];
      if (start != null && next) {
        const nextStart = parseTimeMinutes(next.timeLabel);
        if (nextStart != null) {
          const end = start + duration + (travel ?? 0);
          if (end > nextStart + 5) overlaps += 1;
        }
      }
    }

    if (dayMinutes > 420) overloadedDays += 1;
  }

  deductions += Math.min(16, tightBuffers * 4);
  deductions += Math.min(8, longGaps * 2);
  deductions += Math.min(12, overlaps * 6);
  deductions += Math.min(12, overloadedDays * 6);

  if (tightBuffers) notes.push(`${tightBuffers} tight travel buffer(s) (<15 min)`);
  if (overlaps) notes.push(`${overlaps} likely time overlap(s)`);
  if (overloadedDays) notes.push(`${overloadedDays} overloaded day(s)`);

  return Math.max(0, SQS_WEIGHTS.realism - deductions);
}

function scoreCulturalFit(
  itinerary: TripItinerary,
  interests: string[],
  notes: string[],
): number {
  const tokens = interestTokens(interests);
  if (!tokens.length) {
    notes.push("No interests provided — cultural fit scored neutrally");
    return Math.round(SQS_WEIGHTS.culturalFit * 0.7);
  }

  const allSlots = itinerary.days.flatMap((d) => d.slots);
  if (!allSlots.length) return 0;

  let hits = 0;
  for (const slot of allSlots) {
    const text = slotText(slot);
    if (tokens.some((t) => text.includes(t) || fuzzyInterestHit(t, text))) hits += 1;
  }

  const ratio = hits / allSlots.length;
  const score = Math.round(SQS_WEIGHTS.culturalFit * Math.min(1, ratio / 0.45));
  if (ratio < 0.25) notes.push("Few stops reflect stated interests");
  return score;
}

function fuzzyInterestHit(interest: string, text: string): boolean {
  const map: Record<string, string[]> = {
    history: ["heritage", "museum", "temple", "fort", "palace", "ruin"],
    heritage: ["temple", "shrine", "museum", "palace", "historic"],
    food: ["market", "cuisine", "cafe", "restaurant", "street food", "meal", "lunch"],
    nature: ["park", "garden", "trail", "hike", "lake", "beach", "forest"],
    festivals: ["festival", "celebration", "music", "parade"],
    photography: ["viewpoint", "sunset", "light", "photo"],
    architecture: ["mosque", "cathedral", "dome", "facade", "quarter"],
    markets: ["market", "bazaar", "souk", "stall"],
  };
  const aliases = map[interest] ?? [];
  return aliases.some((a) => text.includes(a));
}

function scoreCompleteness(
  itinerary: TripItinerary,
  expectedDays: number | undefined,
  notes: string[],
): number {
  const days = itinerary.days;
  if (!days.length) return 0;

  const max: number = SQS_WEIGHTS.completeness;
  let dayScore: number = max;
  if (expectedDays && expectedDays > 0) {
    const ratio = Math.min(1, days.length / expectedDays);
    dayScore = Math.round(max * 0.5 * ratio);
    if (days.length < expectedDays) {
      notes.push(`Covers ${days.length}/${expectedDays} expected days`);
    }
  } else {
    dayScore = Math.round(max * 0.5);
  }

  let balanceHits = 0;
  for (const day of days) {
    const parts = new Set(day.slots.map((s) => s.dayPart).filter(Boolean));
    const hasMorning = parts.has("morning");
    const hasAfternoon = parts.has("afternoon");
    const hasEvening = parts.has("evening");
    if (hasMorning && hasAfternoon && hasEvening) balanceHits += 1;
    else if ((hasMorning && hasAfternoon) || (hasAfternoon && hasEvening)) balanceHits += 0.5;
  }

  const balanceRatio = balanceHits / days.length;
  const balanceScore = Math.round(max * 0.5 * balanceRatio);
  if (balanceRatio < 0.5) notes.push("Uneven morning/afternoon/evening coverage");

  return Math.min(max, dayScore + balanceScore);
}

function scoreActionability(itinerary: TripItinerary, notes: string[]): number {
  const slots = itinerary.days.flatMap((d) => d.slots);
  if (!slots.length) return 0;

  let specific = 0;
  let vague = 0;
  for (const slot of slots) {
    const hasPlace = Boolean(slot.placeName?.trim() || (slot.title && !VAGUE_PATTERNS.test(slot.title)));
    const hasConcreteDesc =
      Boolean(slot.description?.trim()) && !VAGUE_PATTERNS.test(slot.description ?? "");
    if (hasPlace && hasConcreteDesc) specific += 1;
    if (VAGUE_PATTERNS.test(slotText(slot))) vague += 1;
  }

  const ratio = specific / slots.length;
  let score = Math.round(SQS_WEIGHTS.actionability * ratio);
  score = Math.max(0, score - Math.min(4, vague));
  if (vague > 0) notes.push(`${vague} vague/filler stop(s)`);
  return score;
}

/**
 * Deterministic Schedule Quality Score (0–100).
 * Used for baseline vs TripMate-improved comparisons in Phase 7 eval.
 */
export function scoreSchedule(input: ScoreScheduleInput): ScheduleQualityResult {
  const notes: string[] = [];
  const breakdown: ScheduleQualityBreakdown = {
    realism: scoreRealism(input.itinerary, notes),
    culturalFit: scoreCulturalFit(input.itinerary, input.interests, notes),
    completeness: scoreCompleteness(input.itinerary, input.expectedDays, notes),
    actionability: scoreActionability(input.itinerary, notes),
  };

  const score = Math.max(
    0,
    Math.min(
      100,
      breakdown.realism +
        breakdown.culturalFit +
        breakdown.completeness +
        breakdown.actionability,
    ),
  );

  return { score, breakdown, notes };
}

import type { TripItinerary } from "@culturecompass/shared";
import { EVAL_CASES, toItineraryRequest, type EvalCase } from "@/lib/eval/cases";
import {
  scoreSchedule,
  type ScheduleQualityResult,
} from "@/lib/eval/schedule-quality-score";
import { getMockItinerary } from "@/lib/mock/itinerary";
import { getMockTripMateResult } from "@/lib/mock/tripmate";
import { proveMockApplyPath } from "@/lib/tripmate/apply-suggestion";

export interface EvalCaseResult {
  id: string;
  destination: string;
  twist: string;
  mode: EvalCase["mode"];
  baseline: ScheduleQualityResult;
  improved: ScheduleQualityResult;
  delta: number;
  appliedSuggestions: number;
  notes: string[];
}

function clone(itinerary: TripItinerary): TripItinerary {
  return JSON.parse(JSON.stringify(itinerary)) as TripItinerary;
}

/**
 * Inject schedule defects that mirror common single-shot itinerary failures
 * (tight buffers, overloaded stops) so TripMate has measurable work.
 */
export function challengeItinerary(itinerary: TripItinerary): TripItinerary {
  const next = clone(itinerary);
  for (const day of next.days) {
    if (day.slots[0]) {
      day.slots[0].travelMinutesToNext = 5;
    }
    const long = day.slots.find((s) => (s.durationMinutes ?? 0) >= 90) ?? day.slots[1];
    if (long) {
      long.durationMinutes = Math.max(long.durationMinutes ?? 90, 160);
    }
  }
  return next;
}

/**
 * Baseline = challenged single-shot schedule (or seeded bad schedule).
 * Final = TripMate conflict/pacing/gap patches applied (cultural add-ons excluded
 * from the scored path so the metric measures schedule repair).
 */
export function runEvalCase(evalCase: EvalCase): EvalCaseResult {
  const request = toItineraryRequest(evalCase);

  const raw = evalCase.seedItinerary
    ? clone(evalCase.seedItinerary)
    : getMockItinerary(request);

  const challenged = evalCase.seedItinerary ? raw : challengeItinerary(raw);

  const baseline = scoreSchedule({
    itinerary: challenged,
    interests: evalCase.interests,
    destination: evalCase.destination,
    expectedDays: evalCase.expectedDays,
  });

  const tripMate = getMockTripMateResult({
    destination: evalCase.destination,
    interests: evalCase.interests,
    duration: evalCase.duration,
    travelStyle: evalCase.travelStyle,
    itinerary: challenged,
    culturalContext: evalCase.twist,
  });

  const repairKinds = new Set(["conflict", "pacing"]);
  const actionable = tripMate.suggestions.filter(
    (s) => s.action && repairKinds.has(s.kind),
  );
  const proof = proveMockApplyPath(challenged, actionable);
  const improvedItinerary = proof.itinerary;

  const improved = scoreSchedule({
    itinerary: improvedItinerary,
    interests: evalCase.interests,
    destination: evalCase.destination,
    expectedDays: evalCase.expectedDays,
  });

  const appliedSuggestions = proof.steps.filter((s) => s.changed).length;
  const notes = [
    ...baseline.notes.map((n) => `baseline: ${n}`),
    ...improved.notes.map((n) => `improved: ${n}`),
    appliedSuggestions
      ? `TripMate applied ${appliedSuggestions} repair suggestion(s)`
      : "TripMate found no repair patches",
  ];

  return {
    id: evalCase.id,
    destination: evalCase.destination,
    twist: evalCase.twist,
    mode: evalCase.mode,
    baseline,
    improved,
    delta: improved.score - baseline.score,
    appliedSuggestions,
    notes,
  };
}

export function runAllEvalCases(cases = EVAL_CASES): EvalCaseResult[] {
  return cases.map(runEvalCase);
}

export function formatEvalMarkdownTable(results: EvalCaseResult[]): string {
  const header = [
    "| Case | Destination | Baseline SQS | + TripMate SQS | Δ | Applied | Twist |",
    "|---|---|---:|---:|---:|---:|---|",
  ];
  const rows = results.map((r) => {
    const delta = r.delta >= 0 ? `+${r.delta}` : `${r.delta}`;
    return `| ${r.id} | ${r.destination} | ${r.baseline.score} | ${r.improved.score} | ${delta} | ${r.appliedSuggestions} | ${r.twist} |`;
  });

  const avgBaseline =
    results.reduce((s, r) => s + r.baseline.score, 0) / Math.max(1, results.length);
  const avgImproved =
    results.reduce((s, r) => s + r.improved.score, 0) / Math.max(1, results.length);
  const avgDelta = avgImproved - avgBaseline;

  const summary = [
    "",
    `**Mean baseline SQS:** ${avgBaseline.toFixed(1)}`,
    `**Mean +TripMate SQS:** ${avgImproved.toFixed(1)}`,
    `**Mean Δ:** ${avgDelta >= 0 ? "+" : ""}${avgDelta.toFixed(1)}`,
  ];

  return [...header, ...rows, ...summary].join("\n");
}

export function formatEvalBreakdownMarkdown(results: EvalCaseResult[]): string {
  const lines = [
    "| Case | Realism B→I | Cultural B→I | Complete B→I | Actionable B→I |",
    "|---|---|---|---|---|",
  ];
  for (const r of results) {
    const b = r.baseline.breakdown;
    const i = r.improved.breakdown;
    lines.push(
      `| ${r.id} | ${b.realism}→${i.realism} | ${b.culturalFit}→${i.culturalFit} | ${b.completeness}→${i.completeness} | ${b.actionability}→${i.actionability} |`,
    );
  }
  return lines.join("\n");
}

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BAD_ROME_SCHEDULE } from "./cases";
import { scoreSchedule } from "./schedule-quality-score";
import { runEvalCase, runAllEvalCases } from "./run-eval";
import { EVAL_CASES } from "./cases";

describe("scoreSchedule", () => {
  it("scores a healthy schedule higher than the bad Rome fixture", () => {
    const bad = scoreSchedule({
      itinerary: BAD_ROME_SCHEDULE,
      interests: ["History"],
      expectedDays: 2,
    });

    const healthier = structuredClone(BAD_ROME_SCHEDULE);
    healthier.days[0].slots[0].travelMinutesToNext = 25;
    healthier.days[0].slots[1].travelMinutesToNext = 25;
    healthier.days[0].slots[1].timeLabel = "12:00";
    healthier.days[0].slots[2].timeLabel = "15:30";
    healthier.days[0].slots[2].durationMinutes = 90;

    const better = scoreSchedule({
      itinerary: healthier,
      interests: ["History"],
      expectedDays: 2,
    });

    assert.ok(bad.score < 70, `bad score was ${bad.score}`);
    assert.ok(better.score > bad.score, `${better.score} !> ${bad.score}`);
  });

  it("rewards cultural fit when interests appear in stops", () => {
    const itinerary = structuredClone(BAD_ROME_SCHEDULE);
    itinerary.days[1].slots[1].tags = ["Food", "Local life"];
    itinerary.days[1].slots[1].description = "Street food stroll through Trastevere.";

    const withFood = scoreSchedule({
      itinerary,
      interests: ["History", "Food"],
      expectedDays: 2,
    });
    const historyOnly = scoreSchedule({
      itinerary,
      interests: ["History"],
      expectedDays: 2,
    });

    assert.ok(withFood.breakdown.culturalFit >= historyOnly.breakdown.culturalFit);
  });
});

describe("runEvalCase", () => {
  it("runs all ten cases and improves E09", () => {
    const results = runAllEvalCases();
    assert.equal(results.length, 10);
    assert.deepEqual(
      results.map((r) => r.id),
      EVAL_CASES.map((c) => c.id),
    );

    const e09 = results.find((r) => r.id === "E09");
    assert.ok(e09);
    assert.ok(e09!.appliedSuggestions >= 1, "E09 should apply at least one patch");
    assert.ok(
      e09!.improved.score >= e09!.baseline.score,
      `E09 should not regress (${e09!.baseline.score} → ${e09!.improved.score})`,
    );
  });

  it("produces a positive or non-negative mean delta across the suite", () => {
    const results = runAllEvalCases();
    const meanDelta =
      results.reduce((s, r) => s + r.delta, 0) / results.length;
    assert.ok(meanDelta >= 0, `mean delta ${meanDelta}`);
  });

  it("runEvalCase is deterministic for E01", () => {
    const a = runEvalCase(EVAL_CASES[0]);
    const b = runEvalCase(EVAL_CASES[0]);
    assert.equal(a.baseline.score, b.baseline.score);
    assert.equal(a.improved.score, b.improved.score);
    assert.equal(a.delta, b.delta);
  });
});

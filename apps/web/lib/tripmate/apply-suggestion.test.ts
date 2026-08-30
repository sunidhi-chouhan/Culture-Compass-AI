import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applySuggestion,
  proveMockApplyPath,
} from "./apply-suggestion";
import { getMockItinerary } from "@/lib/mock/itinerary";
import { getMockTripMateResult } from "@/lib/mock/tripmate";

function baseItinerary() {
  return getMockItinerary({
    destination: "Oaxaca",
    interests: ["food"],
    duration: "3 days",
  });
}

describe("applySuggestion", () => {
  it("increases travel buffer on set_travel_minutes", () => {
    const itinerary = baseItinerary();
    const slot = itinerary.days[0].slots[0];
    slot.travelMinutesToNext = 5;

    const next = applySuggestion(itinerary, {
      id: "s1",
      kind: "conflict",
      severity: "warning",
      title: "Tight",
      detail: "gap",
      relatedSlotIds: [slot.id],
      action: {
        type: "set_travel_minutes",
        slotId: slot.id,
        travelMinutesToNext: 25,
      },
    });

    assert.ok(next);
    assert.equal(next!.itinerary.days[0].slots[0].travelMinutesToNext, 25);
    assert.equal(itinerary.days[0].slots[0].travelMinutesToNext, 5);
    assert.match(next!.summary, /25 min/);
  });

  it("moves a stop with set_time_label", () => {
    const itinerary = baseItinerary();
    const slot = itinerary.days[0].slots[1];
    const next = applySuggestion(itinerary, {
      id: "s-time",
      kind: "gap",
      severity: "info",
      title: "Gap",
      detail: "move",
      relatedSlotIds: [slot.id],
      action: { type: "set_time_label", slotId: slot.id, timeLabel: "16:30" },
    });
    assert.ok(next);
    assert.equal(next!.itinerary.days[0].slots[1].timeLabel, "16:30");
  });

  it("shortens duration", () => {
    const itinerary = baseItinerary();
    const slot = itinerary.days[0].slots[1];
    slot.durationMinutes = 180;
    const next = applySuggestion(itinerary, {
      id: "s-dur",
      kind: "pacing",
      severity: "warning",
      title: "Long",
      detail: "cut",
      relatedSlotIds: [slot.id],
      action: { type: "shorten_duration", slotId: slot.id, durationMinutes: 90 },
    });
    assert.ok(next);
    assert.equal(next!.itinerary.days[0].slots[1].durationMinutes, 90);
  });

  it("swaps two slots while preserving time labels", () => {
    const itinerary = baseItinerary();
    const a = itinerary.days[0].slots[0];
    const b = itinerary.days[0].slots[1];
    const nameA = a.placeName;
    const nameB = b.placeName;
    const timeA = a.timeLabel;

    const next = applySuggestion(itinerary, {
      id: "s2",
      kind: "reorder",
      severity: "info",
      title: "Swap",
      detail: "order",
      relatedSlotIds: [a.id, b.id],
      action: { type: "swap_slots", slotIdA: a.id, slotIdB: b.id },
    });

    assert.ok(next);
    assert.equal(next!.itinerary.days[0].slots[0].placeName, nameB);
    assert.equal(next!.itinerary.days[0].slots[0].timeLabel, timeA);
    assert.equal(next!.itinerary.days[0].slots[1].placeName, nameA);
  });

  it("adds a cultural evening slot sorted by time", () => {
    const itinerary = baseItinerary();
    const beforeCount = itinerary.days[0].slots.length;
    const next = applySuggestion(itinerary, {
      id: "s-add",
      kind: "cultural",
      severity: "info",
      title: "Add",
      detail: "workshop",
      relatedSlotIds: [],
      action: {
        type: "add_slot",
        dayNumber: 1,
        slot: {
          id: "d1-extra",
          dayPart: "evening",
          timeLabel: "19:00",
          title: "Artisan workshop",
          description: "Hands-on craft",
          placeName: "Artisan workshop",
          category: "experience",
          durationMinutes: 75,
          tags: ["Craft"],
          featured: false,
        },
      },
    });
    assert.ok(next);
    assert.equal(next!.itinerary.days[0].slots.length, beforeCount + 1);
    assert.equal(next!.itinerary.days[0].slots.at(-1)?.placeName, "Artisan workshop");
  });

  it("returns null for unknown slot ids", () => {
    const itinerary = baseItinerary();
    const next = applySuggestion(itinerary, {
      id: "missing",
      kind: "conflict",
      severity: "warning",
      title: "Missing",
      detail: "no",
      relatedSlotIds: [],
      action: {
        type: "set_travel_minutes",
        slotId: "does-not-exist",
        travelMinutesToNext: 30,
      },
    });
    assert.equal(next, null);
  });
});

describe("proveMockApplyPath", () => {
  it("applies every actionable mock suggestion and mutates the schedule", () => {
    const itinerary = baseItinerary();
    // Force conflict + gap paths in the mock analyzer.
    itinerary.days[0].slots[0].travelMinutesToNext = 5;
    itinerary.days[0].slots[1].travelMinutesToNext = 50;
    itinerary.days[0].slots[1].durationMinutes = 180;

    const result = getMockTripMateResult({
      destination: "Oaxaca",
      interests: ["food"],
      duration: "3 days",
      itinerary,
    });

    const actionable = result.suggestions.filter((s) => Boolean(s.action));
    assert.ok(actionable.length >= 2);

    const proof = proveMockApplyPath(itinerary, actionable);
    assert.ok(proof.steps.every((s) => s.changed), JSON.stringify(proof.steps, null, 2));

    // Original unchanged (immutability).
    assert.equal(itinerary.days[0].slots[0].travelMinutesToNext, 5);

    // Final schedule differs from the starting one.
    assert.notEqual(JSON.stringify(proof.itinerary), JSON.stringify(itinerary));
  });

  it("sequential applies stack on the latest itinerary", () => {
    const itinerary = baseItinerary();
    const slot = itinerary.days[0].slots[0];
    slot.travelMinutesToNext = 5;

    const first = applySuggestion(itinerary, {
      id: "a",
      kind: "conflict",
      severity: "warning",
      title: "a",
      detail: "a",
      relatedSlotIds: [slot.id],
      action: {
        type: "set_travel_minutes",
        slotId: slot.id,
        travelMinutesToNext: 25,
      },
    });
    assert.ok(first);

    const second = applySuggestion(first!.itinerary, {
      id: "b",
      kind: "gap",
      severity: "info",
      title: "b",
      detail: "b",
      relatedSlotIds: [itinerary.days[0].slots[1].id],
      action: {
        type: "set_time_label",
        slotId: itinerary.days[0].slots[1].id,
        timeLabel: "16:30",
      },
    });
    assert.ok(second);
    assert.equal(second!.itinerary.days[0].slots[0].travelMinutesToNext, 25);
    assert.equal(second!.itinerary.days[0].slots[1].timeLabel, "16:30");
  });
});

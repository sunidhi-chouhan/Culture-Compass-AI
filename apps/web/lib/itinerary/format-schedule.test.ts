import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatDurationMinutes,
  formatTravelToNext,
  getSlotImageUrl,
} from "./format-schedule";

describe("format-schedule", () => {
  it("formats durations", () => {
    assert.equal(formatDurationMinutes(90), "1h 30m");
    assert.equal(formatDurationMinutes(60), "1h");
    assert.equal(formatDurationMinutes(45), "45m");
    assert.equal(formatDurationMinutes(undefined), null);
  });

  it("formats transit labels", () => {
    assert.equal(formatTravelToNext(15), "15 min to next stop");
    assert.equal(formatTravelToNext(0), "Next stop nearby");
    assert.equal(formatTravelToNext(undefined), null);
  });

  it("builds deterministic image urls", () => {
    assert.match(getSlotImageUrl("oaxaca-market"), /picsum\.photos\/seed\/oaxaca-market/);
  });
});

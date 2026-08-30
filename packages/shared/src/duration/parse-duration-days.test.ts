import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseDurationToDayCount } from "./parse-duration-days";

describe("parseDurationToDayCount", () => {
  it("maps common planner presets", () => {
    assert.equal(parseDurationToDayCount("Weekend (2–3 days)"), 2);
    assert.equal(parseDurationToDayCount("weekend"), 2);
    assert.equal(parseDurationToDayCount("3 days"), 3);
    assert.equal(parseDurationToDayCount("1 week"), 7);
  });

  it("parses custom day ranges and clamps", () => {
    assert.equal(parseDurationToDayCount("10 days"), 10);
    assert.equal(parseDurationToDayCount("2-4 days"), 3);
    assert.equal(parseDurationToDayCount("30 days"), 30);
    assert.equal(parseDurationToDayCount("40 days"), 30);
  });

  it("falls back when duration is empty or unknown", () => {
    assert.equal(parseDurationToDayCount(""), 3);
    assert.equal(parseDurationToDayCount("flexible"), 3);
  });
});

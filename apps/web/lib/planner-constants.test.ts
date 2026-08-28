import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildCompassPlanRequest,
  mapBudgetToApiValue,
  mapCompanionToTravelStyle,
  mapDurationToApiValue,
  type PlannerAnswers,
} from "./planner-constants";

const completeAnswers: PlannerAnswers = {
  destination: "Kyoto",
  destinationLocation: null,
  interests: ["History", "Food"],
  companion: "Solo",
  budget: "moderate",
  duration: "1 Week",
  customDuration: "",
};

describe("planner mappings", () => {
  it("maps companion to travel style", () => {
    assert.equal(mapCompanionToTravelStyle("Family"), "family");
    assert.equal(mapCompanionToTravelStyle("Friends"), "adventurous");
  });

  it("maps budget labels", () => {
    assert.match(mapBudgetToApiValue("luxury"), /Luxury/);
  });

  it("maps duration presets", () => {
    assert.equal(mapDurationToApiValue("Weekend", ""), "Weekend (2–3 days)");
    assert.equal(mapDurationToApiValue("Custom", "10 days"), "10 days");
  });

  it("builds a valid compass plan request", () => {
    const request = buildCompassPlanRequest(completeAnswers);
    assert.equal(request.destination, "Kyoto");
    assert.deepEqual(request.interests, ["history", "food"]);
    assert.equal(request.travelStyle, "solo");
    assert.equal(request.duration, "1 week");
    assert.equal(request.lensMode, "tourist");
  });

  it("passes lens mode to request", () => {
    const request = buildCompassPlanRequest(completeAnswers, "local");
    assert.equal(request.lensMode, "local");
  });

  it("omits destination when empty", () => {
    const request = buildCompassPlanRequest({
      ...completeAnswers,
      destination: "",
    });
    assert.equal(request.destination, undefined);
  });
});

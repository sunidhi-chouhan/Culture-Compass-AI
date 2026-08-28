import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getMockCompassPlan } from "./compass-plan";

const baseInput = {
  interests: ["history", "food"],
  budget: "$2000",
  duration: "5 days",
  travelStyle: "cultural",
  notes: "",
};

describe("getMockCompassPlan", () => {
  it("returns tourist attractions for tourist lens", () => {
    const plan = getMockCompassPlan({ ...baseInput, lensMode: "tourist", destination: "Jaipur" });
    assert.ok(plan.attractions.some((a) => /Amber Fort|Heritage Quarter/.test(a.name)));
    assert.equal(plan.featuredDestination.name, "Jaipur");
  });

  it("returns local picks for local lens", () => {
    const plan = getMockCompassPlan({ ...baseInput, lensMode: "local", destination: "Jaipur" });
    assert.ok(
      plan.attractions.some((a) =>
        /temple|chai|market|pottery/i.test(a.name + a.category),
      ),
    );
    assert.match(plan.storySnippet.preview, /local resident/i);
  });

  it("includes story narrative for Story Mode", () => {
    const plan = getMockCompassPlan({ ...baseInput, destination: "Jaipur" });
    assert.ok(plan.storySnippet.narrative.length > 100);
  });

  it("defaults to Jaipur when no destination given", () => {
    const plan = getMockCompassPlan(baseInput);
    assert.equal(plan.featuredDestination.id, "jaipur");
  });
});

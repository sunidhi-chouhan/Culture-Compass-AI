import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { plannerStepToStage } from "./journey-stages";

describe("plannerStepToStage", () => {
  it("maps create steps to Create", () => {
    assert.equal(plannerStepToStage("destination"), "Create");
    assert.equal(plannerStepToStage("duration"), "Create");
  });

  it("maps generate step to Review until generating", () => {
    assert.equal(plannerStepToStage("generate"), "Review");
    assert.equal(plannerStepToStage("generate", { generating: true }), "Generate");
  });
});

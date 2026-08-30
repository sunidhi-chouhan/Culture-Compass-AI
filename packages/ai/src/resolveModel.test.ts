import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { resolveModelName } from "./resolveModel";

describe("resolveModelName", () => {
  const original = process.env.GEMINI_MODEL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.GEMINI_MODEL;
    } else {
      process.env.GEMINI_MODEL = original;
    }
  });

  it("resolves fast preset", () => {
    assert.equal(resolveModelName("fast"), "gemini-2.5-flash");
  });

  it("resolves balanced preset", () => {
    assert.equal(resolveModelName("balanced"), "gemini-2.5-flash");
  });

  it("resolves quality preset", () => {
    assert.equal(resolveModelName("quality"), "gemini-2.5-flash");
  });

  it("falls back to default preset when undefined", () => {
    delete process.env.GEMINI_MODEL;
    assert.equal(resolveModelName(), "gemini-2.5-flash");
  });

  it("uses GEMINI_MODEL env when preset is missing", () => {
    process.env.GEMINI_MODEL = "gemini-custom";
    assert.equal(resolveModelName(), "gemini-custom");
  });
});

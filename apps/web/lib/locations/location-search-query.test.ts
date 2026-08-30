import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { locationSearchQuerySchema } from "@culturecompass/shared";

describe("locationSearchQuerySchema", () => {
  it("accepts valid query", () => {
    const result = locationSearchQuerySchema.safeParse({ q: "indore" });
    assert.equal(result.success, true);
  });

  it("rejects empty query", () => {
    const result = locationSearchQuerySchema.safeParse({ q: "" });
    assert.equal(result.success, false);
  });

  it("rejects single character query", () => {
    const result = locationSearchQuerySchema.safeParse({ q: "i" });
    assert.equal(result.success, false);
  });

  it("rejects query over max length", () => {
    const result = locationSearchQuerySchema.safeParse({ q: "a".repeat(65) });
    assert.equal(result.success, false);
  });

  it("defaults limit to 8", () => {
    const result = locationSearchQuerySchema.safeParse({ q: "tokyo" });
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data.limit, 8);
    }
  });
});

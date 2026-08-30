import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalizeSearchText } from "./normalize";

describe("normalizeSearchText", () => {
  it("lowercases and trims", () => {
    assert.equal(normalizeSearchText("  Tokyo  "), "tokyo");
  });

  it("removes diacritics", () => {
    assert.equal(normalizeSearchText("São Paulo"), "sao paulo");
    assert.equal(normalizeSearchText("Île-de-France"), "ile-de-france");
  });
});

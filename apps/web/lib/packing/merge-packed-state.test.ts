import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PackingList } from "@culturecompass/shared";
import { mergePackedState } from "./merge-packed-state";

function list(items: PackingList["items"]): PackingList {
  return { items, preferences: { extras: [] } };
}

describe("mergePackedState", () => {
  it("returns next when there is no previous list", () => {
    const next = list([
      {
        id: "a",
        label: "Passport",
        category: "documents",
        packed: false,
        essential: true,
      },
    ]);
    assert.equal(mergePackedState(null, next), next);
  });

  it("keeps packed flags by id and by label", () => {
    const previous = list([
      {
        id: "docs-passport",
        label: "Passport / ID",
        category: "documents",
        packed: true,
        essential: true,
      },
      {
        id: "old-shoes",
        label: "Walking shoes",
        category: "footwear",
        packed: true,
        essential: true,
      },
    ]);
    const next = list([
      {
        id: "docs-passport",
        label: "Passport / ID",
        category: "documents",
        packed: false,
        essential: true,
      },
      {
        id: "foot-shoes",
        label: "Walking shoes",
        category: "footwear",
        packed: false,
        essential: true,
      },
      {
        id: "new-item",
        label: "Umbrella",
        category: "activity",
        packed: false,
        essential: false,
      },
    ]);

    const merged = mergePackedState(previous, next);
    assert.equal(merged.items[0]?.packed, true);
    assert.equal(merged.items[1]?.packed, true);
    assert.equal(merged.items[2]?.packed, false);
  });
});

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  JOURNEY_PACKING_SESSION_KEY,
  type PackingList,
} from "@culturecompass/shared";
import {
  clearSessionPacking,
  readSessionPacking,
  writeSessionPacking,
} from "./packing-session-storage";

function memoryStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}

const sample: PackingList = {
  items: [
    {
      id: "p1",
      label: "Passport",
      category: "documents",
      packed: true,
      essential: true,
      reason: "Travel ID",
      source: "essentials",
    },
  ],
  preferences: { extras: [] },
  tripSummary: "Kyoto · 3 Days",
  generatedAt: "2026-08-29T12:00:00.000Z",
};

describe("packing-session-storage", () => {
  it("round-trips a packing list", () => {
    const storage = memoryStorage();
    writeSessionPacking(storage, sample);
    const read = readSessionPacking(storage);
    assert.equal(read?.items[0]?.label, "Passport");
    assert.equal(read?.items[0]?.packed, true);
    assert.equal(read?.tripSummary, "Kyoto · 3 Days");
  });

  it("returns null for missing or corrupt data", () => {
    assert.equal(readSessionPacking(memoryStorage()), null);
    const bad = memoryStorage({ [JOURNEY_PACKING_SESSION_KEY]: "not-json" });
    assert.equal(readSessionPacking(bad), null);
  });

  it("clears only the packing session key", () => {
    const storage = memoryStorage({ theme: "dark" });
    writeSessionPacking(storage, sample);
    clearSessionPacking(storage);
    assert.equal(storage.getItem(JOURNEY_PACKING_SESSION_KEY), null);
    assert.equal(storage.getItem("theme"), "dark");
  });
});

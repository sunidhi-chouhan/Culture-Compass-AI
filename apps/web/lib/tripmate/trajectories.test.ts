import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  appendTripMateStage,
  listTripMateTrajectories,
  startTripMateTrajectory,
  TRIPMATE_TRAJECTORIES_STORAGE_KEY,
} from "./trajectories";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    removeItem(key: string) {
      map.delete(key);
    },
    key() {
      return null;
    },
  };
}

describe("tripmate trajectories", () => {
  it("records analyze → verify → done stages", () => {
    const storage = memoryStorage();
    const row = startTripMateTrajectory(storage, "Oaxaca");
    appendTripMateStage(storage, row.id, { name: "propose", detail: "drafting" });
    appendTripMateStage(
      storage,
      row.id,
      { name: "verify", detail: "ok" },
      { status: "done", suggestionCount: 2 },
    );

    const listed = listTripMateTrajectories(storage);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].status, "done");
    assert.equal(listed[0].suggestionCount, 2);
    assert.ok(listed[0].stages.some((s) => s.name === "analyze"));
    assert.ok(listed[0].stages.some((s) => s.name === "verify"));
    assert.ok(storage.getItem(TRIPMATE_TRAJECTORIES_STORAGE_KEY));
  });
});

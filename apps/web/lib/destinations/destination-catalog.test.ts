import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  destinationCatalogSchema,
  selectFeaturedLocations,
} from "@culturecompass/shared";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("destinations.catalog.json", () => {
  it("loads a catalog with hundreds of destinations", () => {
    const filePath = join(process.cwd(), "data", "destinations.catalog.json");
    const catalog = destinationCatalogSchema.parse(JSON.parse(readFileSync(filePath, "utf8")));

    assert.ok(catalog.length >= 200);
  });

  it("supports deterministic featured selection from the catalog", () => {
    const filePath = join(process.cwd(), "data", "destinations.catalog.json");
    const catalog = destinationCatalogSchema.parse(JSON.parse(readFileSync(filePath, "utf8")));
    const featured = selectFeaturedLocations(catalog, { seed: 12345, limit: 5 });

    assert.equal(featured.length, 5);
    assert.equal(new Set(featured.map((location) => location.id)).size, 5);
    assert.ok(featured.every((location) => location.kind === "destination"));
  });
});

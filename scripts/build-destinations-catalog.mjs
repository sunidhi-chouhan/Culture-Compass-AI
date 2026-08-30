#!/usr/bin/env node
/**
 * Builds apps/web/data/destinations.catalog.json from curated destination tuples.
 * Usage: node scripts/build-destinations-catalog.mjs
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { DESTINATIONS } from "./destinations-catalog-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../apps/web/data/destinations.catalog.json");

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toEntry(tuple) {
  const [name, country, countryCode, region, continent, latitude, longitude, popularity, tags] = tuple;
  const id = `dest:${slugify(name)}-${countryCode.toLowerCase()}`;

  return {
    id,
    name,
    country,
    countryCode,
    region,
    continent,
    latitude,
    longitude,
    popularity,
    tags,
  };
}

function main() {
  const catalog = DESTINATIONS.map(toEntry);
  const ids = new Set();

  for (const entry of catalog) {
    if (ids.has(entry.id)) {
      throw new Error(`Duplicate catalog id: ${entry.id}`);
    }
    ids.add(entry.id);
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
  console.log(`Wrote ${catalog.length} destinations to ${OUT_PATH}`);
}

main();

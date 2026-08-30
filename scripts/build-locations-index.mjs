#!/usr/bin/env node
/**
 * Builds apps/web/data/locations.index.json from GeoNames open data.
 *
 * Sources (free, attribution required — see packages/shared/data/README.md):
 * - https://download.geonames.org/export/dump/cities5000.zip
 * - https://download.geonames.org/export/dump/countryInfo.txt
 *
 * Usage: node scripts/build-locations-index.mjs
 */

import { createWriteStream, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createGunzip } from "node:zlib";
import { pipeline } from "node:stream/promises";
import { get } from "node:https";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_PATH = join(ROOT, "apps/web/data/locations.index.json");
const TMP_DIR = join(ROOT, ".tmp-geonames");

const SUPPLEMENTS = [
  {
    id: "dest:bali",
    name: "Bali",
    country: "Indonesia",
    countryCode: "ID",
    adminRegion: "Bali",
    latitude: -8.4095,
    longitude: 115.1889,
    population: 4300000,
    kind: "destination",
  },
  {
    id: "dest:kerala",
    name: "Kerala",
    country: "India",
    countryCode: "IN",
    adminRegion: "Kerala",
    latitude: 10.8505,
    longitude: 76.2711,
    population: 35000000,
    kind: "destination",
  },
  {
    id: "dest:rome",
    name: "Rome",
    country: "Italy",
    countryCode: "IT",
    adminRegion: "Lazio",
    latitude: 41.9028,
    longitude: 12.4964,
    population: 2873000,
    kind: "destination",
  },
];

function normalizeSearchText(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function buildDisplayLabel(entry) {
  if (entry.kind === "country") {
    return entry.name;
  }
  if (entry.adminRegion && entry.adminRegion !== entry.name) {
    return `${entry.name}, ${entry.adminRegion}, ${entry.country}`;
  }
  return `${entry.name}, ${entry.country}`;
}

function toIndexEntry(raw) {
  const displayLabel = buildDisplayLabel(raw);
  const searchText = normalizeSearchText(
    `${raw.name} ${raw.adminRegion ?? ""} ${raw.country} ${raw.countryCode} ${displayLabel}`,
  );
  return { ...raw, displayLabel, searchText };
}

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed ${url}: ${res.statusCode}`));
        return;
      }
      const file = createWriteStream(destPath);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve()));
      file.on("error", reject);
    }).on("error", reject);
  });
}

async function extractGzip(gzPath, outPath) {
  await pipeline(createGunzip(), createWriteStream(outPath));
  // Fix: need to read gz file
}

async function main() {
  mkdirSync(TMP_DIR, { recursive: true });
  mkdirSync(dirname(OUT_PATH), { recursive: true });

  const countryPath = join(TMP_DIR, "countryInfo.txt");
  const citiesGzPath = join(TMP_DIR, "cities5000.zip");

  console.log("Downloading GeoNames countryInfo.txt...");
  await download("https://download.geonames.org/export/dump/countryInfo.txt", countryPath);

  const admin1Path = join(TMP_DIR, "admin1CodesASCII.txt");
  console.log("Downloading GeoNames admin1CodesASCII.txt...");
  await download("https://download.geonames.org/export/dump/admin1CodesASCII.txt", admin1Path);

  console.log("Downloading GeoNames cities5000.zip...");
  await download("https://download.geonames.org/export/dump/cities5000.zip", citiesGzPath);

  const countries = new Map();
  const countryLines = readFileSync(countryPath, "utf8").split("\n");
  for (const line of countryLines) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("\t");
    const iso = cols[0];
    const name = cols[4];
    if (!iso || !name) continue;
    countries.set(iso, name);
  }

  const admin1Names = new Map();
  const admin1Lines = readFileSync(admin1Path, "utf8").split("\n");
  for (const line of admin1Lines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const code = cols[0];
    const name = cols[1];
    if (code && name) admin1Names.set(code, name);
  }

  // Extract zip using unzip command
  const { execSync } = await import("node:child_process");
  execSync(`unzip -o -q "${citiesGzPath}" -d "${TMP_DIR}"`);

  const citiesPath = join(TMP_DIR, "cities5000.txt");
  const cityLines = readFileSync(citiesPath, "utf8").split("\n");

  const entries = [];

  for (const iso of countries.keys()) {
    const name = countries.get(iso);
    entries.push(
      toIndexEntry({
        id: `country:${iso}`,
        name,
        country: name,
        countryCode: iso,
        latitude: 0,
        longitude: 0,
        population: 0,
        kind: "country",
      }),
    );
  }

  for (const line of cityLines) {
    if (!line.trim()) continue;
    const cols = line.split("\t");
    const geonameId = cols[0];
    const name = cols[1];
    const lat = parseFloat(cols[4]);
    const lng = parseFloat(cols[5]);
    const countryCode = cols[8];
    const admin1Code = cols[10] || undefined;
    const admin1Key = admin1Code ? `${countryCode}.${admin1Code}` : undefined;
    const admin1 = admin1Key ? admin1Names.get(admin1Key) ?? admin1Code : undefined;
    const population = parseInt(cols[14], 10) || 0;
    const country = countries.get(countryCode) ?? countryCode;

    if (!geonameId || !name || Number.isNaN(lat)) continue;

    entries.push(
      toIndexEntry({
        id: `geoname:${geonameId}`,
        name,
        country,
        countryCode,
        adminRegion: admin1,
        latitude: lat,
        longitude: lng,
        population,
        kind: "city",
      }),
    );
  }

  for (const supplement of SUPPLEMENTS) {
    entries.push(toIndexEntry(supplement));
  }

  writeFileSync(OUT_PATH, JSON.stringify(entries));
  console.log(`Wrote ${entries.length} locations to ${OUT_PATH}`);

  try {
    unlinkSync(citiesGzPath);
  } catch {
    /* ignore */
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

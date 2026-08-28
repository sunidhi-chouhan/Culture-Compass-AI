# GeoNames Geographic Data

CultureCompass location search uses data from [GeoNames](https://www.geonames.org/), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Sources

| File | URL | Description |
|------|-----|-------------|
| `cities5000.txt` | https://download.geonames.org/export/dump/cities5000.zip | Cities with population > 5,000 |
| `countryInfo.txt` | https://download.geonames.org/export/dump/countryInfo.txt | Country names and ISO codes |
| `admin1CodesASCII.txt` | https://download.geonames.org/export/dump/admin1CodesASCII.txt | First-level admin division names |

## Attribution

> This product uses data from GeoNames.org — https://www.geonames.org/ (CC BY 4.0)

## Regenerating the index

From the repository root:

```bash
node scripts/build-locations-index.mjs
```

Output: `apps/web/data/locations.index.json` (server-side only — not bundled for the client).

## Supplemental destinations

Curated tourist regions (Bali, Kerala, Rome) are appended in the build script because they are common travel destinations that may not appear as standalone city records.

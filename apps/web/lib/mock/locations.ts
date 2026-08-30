import type { Location, LocationIndexEntry } from "@culturecompass/shared";

/** Deterministic mock index for tests and USE_MOCK_LOCATIONS=true. */
export const MOCK_LOCATION_INDEX: LocationIndexEntry[] = [
  {
    id: "geoname:1269743",
    name: "Indore",
    country: "India",
    countryCode: "IN",
    adminRegion: "Madhya Pradesh",
    latitude: 22.71792,
    longitude: 75.8333,
    population: 1994397,
    kind: "city",
    displayLabel: "Indore, Madhya Pradesh, India",
    searchText: "indore madhya pradesh india in indore, madhya pradesh, india",
  },
  {
    id: "geoname:1277333",
    name: "Bhopal",
    country: "India",
    countryCode: "IN",
    adminRegion: "Madhya Pradesh",
    latitude: 23.25469,
    longitude: 77.40289,
    population: 1599916,
    kind: "city",
    displayLabel: "Bhopal, Madhya Pradesh, India",
    searchText: "bhopal madhya pradesh india in bhopal, madhya pradesh, india",
  },
  {
    id: "country:IN",
    name: "India",
    country: "India",
    countryCode: "IN",
    latitude: 0,
    longitude: 0,
    population: 0,
    kind: "country",
    displayLabel: "India",
    searchText: "india in india",
  },
  {
    id: "country:JP",
    name: "Japan",
    country: "Japan",
    countryCode: "JP",
    latitude: 0,
    longitude: 0,
    population: 0,
    kind: "country",
    displayLabel: "Japan",
    searchText: "japan jp japan",
  },
  {
    id: "geoname:1850147",
    name: "Tokyo",
    country: "Japan",
    countryCode: "JP",
    adminRegion: "Tokyo",
    latitude: 35.6895,
    longitude: 139.69171,
    population: 9733276,
    kind: "city",
    displayLabel: "Tokyo, Tokyo, Japan",
    searchText: "tokyo tokyo japan jp tokyo, tokyo, japan",
  },
  {
    id: "geoname:2988507",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    adminRegion: "Île-de-France",
    latitude: 48.85341,
    longitude: 2.3488,
    population: 2138551,
    kind: "city",
    displayLabel: "Paris, Île-de-France, France",
    searchText: "paris ile-de-france france fr paris, ile-de-france, france",
  },
  {
    id: "dest:jaipur",
    name: "Jaipur",
    country: "India",
    countryCode: "IN",
    adminRegion: "Rajasthan",
    latitude: 26.9124,
    longitude: 75.7873,
    population: 3046163,
    kind: "destination",
    displayLabel: "Jaipur, Rajasthan, India",
    searchText: "jaipur rajasthan india in jaipur, rajasthan, india",
  },
];

export function getMockLocationById(id: string): Location | undefined {
  const entry = MOCK_LOCATION_INDEX.find((item) => item.id === id);
  if (!entry) return undefined;
  const { searchText, ...location } = entry;
  void searchText;
  return location;
}

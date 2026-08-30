import {
  featuredDestinationsResponseSchema,
  type Location,
} from "@culturecompass/shared";

export interface FetchFeaturedDestinationsOptions {
  limit?: number;
  seed?: number;
  sessionSeed?: string;
  signal?: AbortSignal;
}

export async function fetchFeaturedDestinations(
  options: FetchFeaturedDestinationsOptions = {},
): Promise<{ results: Location[]; seed: number }> {
  const params = new URLSearchParams();

  if (options.limit !== undefined) {
    params.set("limit", String(options.limit));
  }
  if (options.seed !== undefined) {
    params.set("seed", String(options.seed));
  }
  if (options.sessionSeed) {
    params.set("session", options.sessionSeed);
  }

  const query = params.toString();
  const url = query ? `/api/destinations/suggestions?${query}` : "/api/destinations/suggestions";

  const response = await fetch(url, { signal: options.signal });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Featured destinations request failed (${response.status}).`);
  }

  const data = featuredDestinationsResponseSchema.parse(await response.json());
  return data;
}

import type { Location, LocationSearchResponse } from "@culturecompass/shared";

export async function fetchLocationSearch(
  query: string,
  options?: { limit?: number; signal?: AbortSignal },
): Promise<Location[]> {
  const params = new URLSearchParams({ q: query });
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  const response = await fetch(`/api/locations/search?${params.toString()}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Unable to search locations.");
  }

  const data = (await response.json()) as LocationSearchResponse;
  return data.results;
}

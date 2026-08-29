/**
 * Map planner/API duration strings to a day count for itinerary generation.
 * Clamped to 1–14 so mock and UI stay bounded.
 */
export function parseDurationToDayCount(duration: string): number {
  const raw = duration.trim().toLowerCase();
  if (!raw) return 3;

  if (raw.includes("weekend")) return 3;
  if (raw.includes("1 week") || raw.includes("one week") || /\b7\s*days?\b/.test(raw)) {
    return 7;
  }
  if (raw.includes("2 week") || raw.includes("two week") || /\b14\s*days?\b/.test(raw)) {
    return 14;
  }

  const match = raw.match(/(\d+)\s*(?:-|–|to\s+)?(\d+)?\s*days?/);
  if (match) {
    const first = Number(match[1]);
    const second = match[2] ? Number(match[2]) : first;
    const mid = Math.round((first + second) / 2);
    return clampDayCount(mid);
  }

  const bare = raw.match(/^(\d+)$/);
  if (bare) return clampDayCount(Number(bare[1]));

  if (raw.includes("3 day")) return 3;
  return 3;
}

function clampDayCount(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(14, Math.floor(n));
}

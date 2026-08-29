/** Format minutes as "1h 30m" / "45m". */
export function formatDurationMinutes(minutes: number | undefined): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatTravelToNext(minutes: number | undefined): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) return null;
  if (minutes === 0) return "Next stop nearby";
  return `${minutes} min to next stop`;
}

export function getSlotImageUrl(seed: string, width = 480, height = 320): string {
  const safe = encodeURIComponent(seed.trim() || "journey");
  return `https://picsum.photos/seed/${safe}/${width}/${height}`;
}

export function slotImageSeed(slot: {
  imageSeed?: string;
  placeName?: string;
  id: string;
}): string {
  return slot.imageSeed || slot.placeName || slot.id;
}

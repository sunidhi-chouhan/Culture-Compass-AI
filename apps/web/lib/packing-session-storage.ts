import {
  JOURNEY_PACKING_SESSION_KEY,
  packingListSchema,
  type PackingList,
} from "@culturecompass/shared";

export function readSessionPacking(
  storage: Pick<Storage, "getItem">,
): PackingList | null {
  const raw = storage.getItem(JOURNEY_PACKING_SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = packingListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeSessionPacking(
  storage: Pick<Storage, "setItem">,
  packing: PackingList,
): void {
  storage.setItem(JOURNEY_PACKING_SESSION_KEY, JSON.stringify(packing));
}

export function clearSessionPacking(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(JOURNEY_PACKING_SESSION_KEY);
}

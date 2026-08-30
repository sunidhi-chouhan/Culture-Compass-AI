import type { PackingList } from "@culturecompass/shared";

/**
 * Preserve packed=true across refresh when item id or label matches.
 */
export function mergePackedState(
  previous: PackingList | null,
  next: PackingList,
): PackingList {
  if (!previous?.items.length) return next;
  const byId = new Map(previous.items.map((i) => [i.id, i]));
  const byLabel = new Map(
    previous.items.map((i) => [i.label.trim().toLowerCase(), i]),
  );

  return {
    ...next,
    items: next.items.map((item) => {
      const prior = byId.get(item.id) ?? byLabel.get(item.label.trim().toLowerCase());
      if (prior?.packed) return { ...item, packed: true };
      return item;
    }),
  };
}

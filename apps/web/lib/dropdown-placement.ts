export type DropdownPlacement = "below" | "above";

const DEFAULT_MAX_HEIGHT = 256;
const DEFAULT_GAP = 8;

export function computeDropdownPlacement(
  rect: DOMRect,
  maxHeight = DEFAULT_MAX_HEIGHT,
  gap = DEFAULT_GAP,
): DropdownPlacement {
  const spaceBelow = window.innerHeight - rect.bottom - gap;
  const spaceAbove = rect.top - gap;

  if (spaceBelow >= maxHeight) {
    return "below";
  }

  if (spaceAbove >= maxHeight) {
    return "above";
  }

  return spaceBelow >= spaceAbove ? "below" : "above";
}

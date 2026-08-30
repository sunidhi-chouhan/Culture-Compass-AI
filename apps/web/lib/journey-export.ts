import type {
  CompassPlanRequest,
  CompassPlanResponse,
  HiddenGem,
  PackingItem,
  PackingList,
  TripItinerary,
} from "@culturecompass/shared";
import { parseDurationToDayCount } from "@culturecompass/shared";
import { formatDurationMinutes } from "@/lib/itinerary/format-schedule";
import { buildDashboardCards, type DashboardCardId } from "@/lib/dashboard-helpers";

export interface JourneyExportSlot {
  timeLabel: string;
  title: string;
  placeName?: string;
  description: string;
  durationLabel: string | null;
  tags: string[];
}

export interface JourneyExportDay {
  dayNumber: number;
  title: string;
  summary: string;
  slots: JourneyExportSlot[];
}

export interface JourneyExportPackingGroup {
  category: string;
  items: Array<{
    label: string;
    packed: boolean;
    essential: boolean;
    reason?: string;
    quantityLabel?: string;
  }>;
}

export interface JourneyExportInsight {
  id: DashboardCardId;
  title: string;
  summary?: string;
  bullets: string[];
  footer?: string;
}

export interface JourneyExport {
  brand: string;
  title: string;
  destination: string;
  country: string;
  tagline: string;
  durationLabel: string;
  dayCount: number;
  interests: string[];
  notes?: string;
  days: JourneyExportDay[];
  packingSummary?: string;
  packingGroups: JourneyExportPackingGroup[];
  hiddenGems: HiddenGem[];
  insights: JourneyExportInsight[];
}

export function slugifyJourneyName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "journey"
  );
}

export function journeyPdfFilename(destination: string): string {
  return `journeymind-${slugifyJourneyName(destination)}.pdf`;
}

export function buildJourneyExport(input: {
  plan: CompassPlanResponse;
  request?: CompassPlanRequest | null;
  itinerary?: TripItinerary | null;
  packing?: PackingList | null;
  title?: string;
}): JourneyExport {
  const dest = input.plan.featuredDestination;
  const durationLabel = input.request?.duration?.trim() || dest.bestTimeToVisit;
  const itinerary = input.itinerary ?? input.plan.itinerary ?? null;
  const days = (itinerary?.days ?? []).map((day) => ({
    dayNumber: day.dayNumber,
    title: day.title || `Day ${day.dayNumber}`,
    summary: day.summary || "",
    slots: day.slots.map((slot) => ({
      timeLabel: slot.timeLabel || slot.dayPart,
      title: slot.title,
      placeName: slot.placeName,
      description: slot.description || "",
      durationLabel: formatDurationMinutes(slot.durationMinutes),
      tags: slot.tags ?? [],
    })),
  }));

  return {
    brand: "JourneyMind",
    title:
      input.title?.trim() ||
      `${dest.name}${durationLabel ? ` · ${durationLabel}` : ""}`,
    destination: dest.name,
    country: dest.country,
    tagline: dest.tagline,
    durationLabel,
    dayCount: days.length || parseDurationToDayCount(durationLabel),
    interests: input.request?.interests ?? [],
    notes: itinerary?.notes,
    days,
    packingSummary: input.packing?.tripSummary,
    packingGroups: groupPacking(input.packing?.items ?? []),
    hiddenGems: input.plan.hiddenGems ?? [],
    insights: buildExportInsights(input.plan),
  };
}

const INSIGHT_ORDER: DashboardCardId[] = [
  "heritage",
  "food",
  "events",
  "budget",
  "local-tips",
  "shopping",
  "etiquette",
  "story",
];

function buildExportInsights(plan: CompassPlanResponse): JourneyExportInsight[] {
  const cards = buildDashboardCards(plan);
  const wanted = new Set(INSIGHT_ORDER);
  return cards
    .filter((card) => wanted.has(card.id))
    .sort((a, b) => INSIGHT_ORDER.indexOf(a.id) - INSIGHT_ORDER.indexOf(b.id))
    .map((card) => ({
      id: card.id,
      title: card.title,
      summary: card.summary,
      bullets: card.bullets.map((bullet) => {
        const place = [bullet.placeName, bullet.locationName].filter(Boolean).join(" · ");
        return place ? `${place} — ${bullet.text}` : bullet.text;
      }),
      footer: card.footer,
    }));
}

function groupPacking(items: PackingItem[]): JourneyExportPackingGroup[] {
  const order: string[] = [];
  const map = new Map<string, JourneyExportPackingGroup["items"]>();

  for (const item of items) {
    const category = item.category?.trim() || "general";
    if (!map.has(category)) {
      map.set(category, []);
      order.push(category);
    }
    map.get(category)!.push({
      label: item.label,
      packed: item.packed,
      essential: item.essential,
      reason: item.reason,
      quantityLabel: item.quantityLabel ?? (item.quantity ? `×${item.quantity}` : undefined),
    });
  }

  return order.map((category) => ({
    category,
    items: map.get(category) ?? [],
  }));
}

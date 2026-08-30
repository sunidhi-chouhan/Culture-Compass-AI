import type {
  CompassPlanRequest,
  CompassPlanResponse,
  PackingRequest,
  TripItinerary,
} from "@culturecompass/shared";
import { parseDurationToDayCount } from "@/lib/itinerary/parse-duration-days";
import { resolveDashboardMeta } from "@/lib/dashboard-helpers";

export interface ActivitySignals {
  temples: boolean;
  hiking: boolean;
  beach: boolean;
  photography: boolean;
  festivals: boolean;
  markets: boolean;
  walkingHeavy: boolean;
}

export interface ClimateSignals {
  rain: boolean;
  mild: boolean;
  cold: boolean;
  hot: boolean;
  labels: string[];
}

export interface TripPackingContext {
  destination: string;
  durationLabel: string;
  dayCount: number;
  travelStyle: string;
  companionLabel: string;
  interests: string[];
  activitySignals: ActivitySignals;
  climateSignals: ClimateSignals;
  activityHints: string[];
  tripSummary: string;
  culturalContext: string;
  fingerprint: string;
  weatherInsightLines: string[];
  activityInsightLines: string[];
  toPackingRequest: (preferences?: PackingRequest["preferences"]) => PackingRequest;
}

const STYLE_LABEL: Record<string, string> = {
  solo: "Solo",
  relaxed: "Couple",
  adventurous: "Friends",
  family: "Family",
};

function slotBlob(itinerary: TripItinerary | null | undefined): string {
  if (!itinerary?.days.length) return "";
  const parts: string[] = [];
  for (const day of itinerary.days) {
    for (const slot of day.slots) {
      parts.push(
        slot.category ?? "",
        slot.title,
        slot.description ?? "",
        slot.placeName ?? "",
        ...(slot.tags ?? []),
      );
    }
  }
  return parts.join(" ").toLowerCase();
}

function detectActivitySignals(
  blob: string,
  interests: string[],
  itinerary: TripItinerary | null | undefined,
  activityNotes: string,
): ActivitySignals {
  const interestText = interests.join(" ").toLowerCase();
  const notes = activityNotes.toLowerCase();
  const text = `${blob} ${interestText} ${notes}`;

  let walkingMinutes = 0;
  let slotCount = 0;
  if (itinerary?.days.length) {
    for (const day of itinerary.days) {
      for (const slot of day.slots) {
        slotCount += 1;
        walkingMinutes += slot.durationMinutes ?? 60;
        walkingMinutes += slot.travelMinutesToNext ?? 0;
      }
    }
  }
  const avgMinutesPerDay =
    itinerary?.days.length ? walkingMinutes / itinerary.days.length : 0;

  return {
    temples: /temple|heritage|shrine|mosque|cathedral|religious|sacred|museum|culture|history/.test(
      text,
    ),
    hiking: /hike|hiking|trek|trail|nature|outdoor|park|mountain/.test(text),
    beach: /beach|swim|coast|sea|ocean|snorkel/.test(text),
    photography: /photo|photography|camera|viewpoint|sunset/.test(text),
    festivals: /festival|celebration|parade|music|nightlife|party/.test(text),
    markets: /market|food|cuisine|street food|bazaar|cooking|culinary/.test(text),
    walkingHeavy:
      /walking|walkable|stroll/.test(text) ||
      avgMinutesPerDay >= 280 ||
      (slotCount >= 6 && avgMinutesPerDay >= 220),
  };
}

function detectClimateSignals(
  bestTime: string,
  weatherLine: string,
  climateNotes: string,
): ClimateSignals {
  const text = `${bestTime} ${weatherLine} ${climateNotes}`.toLowerCase();
  const rain = /rain|wet|monsoon|humid|shower/.test(text);
  const cold = /cold|cool|winter|snow|chilly/.test(text);
  const hot = /hot|heat|summer|sun|warm|tropical/.test(text);
  const mild =
    /mild|pleasant|spring|autumn|fall|temperate/.test(text) || (!hot && !cold && Boolean(text.trim()));

  const labels: string[] = [];
  if (rain) labels.push("Rain possible");
  if (cold) labels.push("Cool evenings");
  if (hot) labels.push("Warm / sunny days");
  if (mild && !hot && !cold) labels.push("Mild evenings");
  if (!labels.length && bestTime.trim()) labels.push(`Best season: ${bestTime.trim()}`);

  return { rain, mild, cold, hot, labels };
}

function activityInsightLines(signals: ActivitySignals): string[] {
  const lines: string[] = [];
  if (signals.walkingHeavy) lines.push("Walking-heavy days");
  if (signals.temples) lines.push("Cultural / religious sites");
  if (signals.hiking) lines.push("Outdoor / hiking");
  if (signals.festivals) lines.push("Festival visits");
  if (signals.markets) lines.push("Markets & food stops");
  if (signals.photography) lines.push("Photography");
  if (signals.beach) lines.push("Beach time");
  return lines.slice(0, 6);
}

/**
 * Build deterministic packing context from the active journey.
 */
export function buildTripPackingContext(input: {
  plan: CompassPlanResponse;
  request: CompassPlanRequest;
  itinerary?: TripItinerary | null;
  climateNotes?: string;
  activityNotes?: string;
}): TripPackingContext {
  const { plan, request } = input;
  const itinerary = input.itinerary ?? plan.itinerary ?? null;
  const destination =
    request.destination?.trim() || plan.featuredDestination.name || "your trip";
  const durationLabel = request.duration?.trim() || "a few days";
  const dayCount = parseDurationToDayCount(durationLabel);
  const travelStyle = request.travelStyle || "solo";
  const companionLabel = STYLE_LABEL[travelStyle] ?? travelStyle;
  const interests = request.interests ?? [];
  const climateNotes = input.climateNotes?.trim() ?? "";
  const activityNotes = input.activityNotes?.trim() ?? "";

  const dashboard = resolveDashboardMeta(plan);
  const bestTime = plan.featuredDestination.bestTimeToVisit ?? "";
  const weatherLine = dashboard.weather ?? "";

  const blob = slotBlob(itinerary);
  const activitySignals = detectActivitySignals(blob, interests, itinerary, activityNotes);
  const climateSignals = detectClimateSignals(bestTime, weatherLine, climateNotes);

  const activityHints = new Set<string>();
  for (const interest of interests) activityHints.add(interest);
  if (activitySignals.temples) activityHints.add("temples");
  if (activitySignals.hiking) activityHints.add("hiking");
  if (activitySignals.beach) activityHints.add("beach");
  if (activitySignals.photography) activityHints.add("photography");
  if (activitySignals.festivals) activityHints.add("festivals");
  if (activitySignals.markets) activityHints.add("markets");
  if (activitySignals.walkingHeavy) activityHints.add("walking");
  if (itinerary?.days.length) {
    for (const day of itinerary.days) {
      for (const slot of day.slots) {
        if (slot.category) activityHints.add(slot.category);
        for (const tag of slot.tags ?? []) activityHints.add(tag);
      }
    }
  }

  const interestChip = interests.slice(0, 2).join(", ") || "Culture";
  const tripSummary = `${destination} · ${durationLabel} · ${interestChip} · ${companionLabel}`;

  const culturalContext = [
    plan.featuredDestination.tagline,
    bestTime,
    weatherLine,
    ...plan.attractions.slice(0, 3).map((a) => a.name),
    activityNotes,
  ]
    .filter(Boolean)
    .join(" · ");

  const fingerprint = [
    destination,
    durationLabel,
    interests.join(","),
    travelStyle,
    itinerary?.generatedAt ?? `days:${itinerary?.days.length ?? 0}`,
    climateNotes,
    activityNotes,
  ].join("|");

  const weatherInsightLines = climateSignals.labels.slice(0, 4);
  const activityLines = activityInsightLines(activitySignals);
  if (activityNotes) activityLines.unshift(activityNotes.slice(0, 80));

  return {
    destination,
    durationLabel,
    dayCount,
    travelStyle,
    companionLabel,
    interests,
    activitySignals,
    climateSignals,
    activityHints: [...activityHints].slice(0, 20),
    tripSummary,
    culturalContext,
    fingerprint,
    weatherInsightLines,
    activityInsightLines: activityLines.slice(0, 6),
    toPackingRequest(preferences) {
      return {
        destination,
        interests,
        duration: durationLabel,
        travelStyle,
        budget: request.budget,
        culturalContext,
        preferences,
        activityHints: [...activityHints].slice(0, 20),
        modelPreset: request.modelPreset,
      };
    },
  };
}

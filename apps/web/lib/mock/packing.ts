import type {
  PackingItem,
  PackingItemSource,
  PackingList,
  PackingPreferences,
  PackingRequest,
} from "@culturecompass/shared";
import { parseDurationToDayCount } from "@/lib/itinerary/parse-duration-days";

interface ItemOpts {
  id: string;
  label: string;
  category: string;
  essential?: boolean;
  reason?: string;
  notes?: string;
  quantity?: number;
  quantityLabel?: string;
  source?: PackingItemSource;
}

function item(opts: ItemOpts): PackingItem {
  return {
    id: opts.id,
    label: opts.label,
    category: opts.category,
    packed: false,
    essential: opts.essential ?? false,
    reason: opts.reason,
    notes: opts.notes,
    quantity: opts.quantity,
    quantityLabel: opts.quantityLabel,
    source: opts.source ?? "essentials",
  };
}

function blobFrom(input: PackingRequest): string {
  return [
    input.interests.join(" "),
    (input.activityHints ?? []).join(" "),
    input.preferences?.activityNotes ?? "",
    input.culturalContext ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

function climateBlob(input: PackingRequest): string {
  return [
    input.preferences?.climateNotes ?? "",
    input.culturalContext ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * Journey-aware packing seed for mock AI and client fallback.
 */
export function getMockPackingList(
  input: PackingRequest,
  meta?: { fingerprint?: string; tripSummary?: string },
): PackingList {
  const destination = input.destination.trim() || "your trip";
  const duration = input.duration?.trim() || "a few days";
  const dayCount = parseDurationToDayCount(duration);
  const blob = blobFrom(input);
  const climate = climateBlob(input);

  const prefs: PackingPreferences = {
    climateNotes: input.preferences?.climateNotes,
    activityNotes: input.preferences?.activityNotes,
    extras: input.preferences?.extras ?? [],
  };

  const tees = Math.min(7, Math.max(2, dayCount));
  const socks = Math.min(8, dayCount + 1);

  const items: PackingItem[] = [
    item({
      id: "docs-passport",
      label: "Passport / ID",
      category: "documents",
      essential: true,
      source: "essentials",
      reason: `Required travel ID for ${destination}`,
    }),
    item({
      id: "docs-booking",
      label: "Booking confirmations (offline copy)",
      category: "documents",
      essential: true,
      source: "essentials",
      reason: "Keep stays and tickets available offline",
    }),
    item({
      id: "money-card",
      label: "Payment card + a little local cash",
      category: "documents",
      essential: true,
      source: "essentials",
      reason: "Markets and small vendors may prefer cash",
    }),
    item({
      id: "wear-tees",
      label: "Breathable T-shirts",
      category: "clothing",
      essential: true,
      source: "essentials",
      quantity: tees,
      quantityLabel: String(tees),
      reason: `Based on your ${dayCount}-day trip`,
    }),
    item({
      id: "wear-layers",
      label: "Comfortable day layers",
      category: "clothing",
      essential: true,
      source: "essentials",
      reason: `For ${duration} · walking-friendly days`,
    }),
    item({
      id: "wear-socks",
      label: "Socks",
      category: "clothing",
      essential: true,
      source: "essentials",
      quantity: socks,
      quantityLabel: `${socks} pairs`,
      reason: `${dayCount} days + 1 spare`,
    }),
    item({
      id: "foot-shoes",
      label: "Broken-in walking shoes",
      category: "footwear",
      essential: true,
      source: "essentials",
      reason: "Recommended · expect plenty of walking",
    }),
    item({
      id: "kit-charger",
      label: "Phone charger + cable",
      category: "electronics",
      essential: true,
      source: "essentials",
      reason: "Maps and tickets stay available",
    }),
    item({
      id: "kit-adapter",
      label: "Universal plug adapter",
      category: "electronics",
      essential: true,
      source: "essentials",
      reason: `Outlet compatibility for ${destination}`,
    }),
    item({
      id: "kit-meds",
      label: "Personal medication + blister kit",
      category: "health",
      essential: true,
      source: "essentials",
      reason: "Walking days and long days out",
    }),
  ];

  const weatherLines: string[] = [];
  const activityLines: string[] = [];
  let itineraryAdded = 0;

  const walkingHeavy =
    /walking|walkable/.test(blob) ||
    (input.activityHints ?? []).some((h) => /walking|sightseeing/.test(h.toLowerCase()));
  if (walkingHeavy) {
    activityLines.push("Walking-heavy itinerary");
    items.push(
      item({
        id: "act-daybag",
        label: "Lightweight day bag",
        category: "activity",
        source: "itinerary",
        reason: "Useful for markets and walking days",
        notes: "Recommended because your itinerary includes lots of on-foot exploring.",
      }),
    );
    itineraryAdded += 1;
  }

  if (/temple|heritage|shrine|mosque|cathedral|religious|sacred|museum|culture|history/.test(blob)) {
    activityLines.push("Cultural / religious sites");
    items.push(
      item({
        id: "act-modest",
        label: "Modest outfit for temple visits",
        category: "activity",
        essential: true,
        source: "itinerary",
        reason: "Recommended for cultural and religious sites",
        notes: "Recommended because your itinerary includes religious and cultural sites.",
      }),
    );
    itineraryAdded += 1;
  }

  if (/hike|hiking|trek|trail|nature|outdoor|park/.test(blob)) {
    activityLines.push("Outdoor / hiking");
    items.push(
      item({
        id: "act-hike-shoes",
        label: "Hiking shoes or trail trainers",
        category: "footwear",
        source: "itinerary",
        reason: "Your days include outdoor / nature stops",
      }),
      item({
        id: "act-bottle",
        label: "Refillable water bottle",
        category: "activity",
        essential: true,
        source: "itinerary",
        reason: "Stay hydrated on outdoor stretches",
      }),
    );
    itineraryAdded += 2;
  }

  if (/beach|swim|coast|ocean|snorkel/.test(blob)) {
    activityLines.push("Beach time");
    items.push(
      item({
        id: "act-swim",
        label: "Swimwear",
        category: "activity",
        source: "itinerary",
        reason: "Beach or coastal stops on your days",
      }),
    );
    itineraryAdded += 1;
  }

  if (/photo|photography|camera|viewpoint/.test(blob)) {
    activityLines.push("Photography");
    items.push(
      item({
        id: "act-camera",
        label: "Camera + spare battery",
        category: "electronics",
        source: "itinerary",
        reason: "Photography shows up in your interests / days",
      }),
    );
    itineraryAdded += 1;
  }

  if (/festival|celebration|parade|music|nightlife/.test(blob)) {
    activityLines.push("Festival visits");
    items.push(
      item({
        id: "act-fest",
        label: "Light evening layer for festivals",
        category: "activity",
        source: "itinerary",
        reason: "Festival or late-evening plans on this trip",
      }),
      item({
        id: "act-ear",
        label: "Compact earplugs",
        category: "comfort",
        source: "itinerary",
        reason: "Helpful for loud evening events",
      }),
    );
    itineraryAdded += 2;
  }

  if (/market|food|cuisine|street food|bazaar/.test(blob)) {
    activityLines.push("Markets & food stops");
    items.push(
      item({
        id: "act-wipes",
        label: "Hand sanitizer / wet wipes",
        category: "health",
        essential: true,
        source: "itinerary",
        reason: "Handy after markets and street-food stops",
      }),
    );
    itineraryAdded += 1;
  }

  if (/rain|wet|monsoon|humid|shower/.test(climate) || /rain/.test(blob)) {
    weatherLines.push("Rain possible → compact umbrella");
    items.push(
      item({
        id: "wx-umbrella",
        label: "Compact umbrella",
        category: "activity",
        essential: true,
        source: "weather",
        reason: "Rain expected · stay dry between stops",
      }),
    );
  }
  if (/mild|pleasant|spring|autumn|fall|evening/.test(climate) || /mild/.test(climate)) {
    weatherLines.push("Mild evenings → light jacket");
    items.push(
      item({
        id: "wx-jacket",
        label: "Lightweight evening layer",
        category: "clothing",
        source: "weather",
        reason: "Mild evenings expected",
      }),
    );
  }
  if (/cold|cool|winter|snow|chilly/.test(climate)) {
    weatherLines.push("Cool evenings → warm mid-layer");
    items.push(
      item({
        id: "wx-fleece",
        label: "Warm mid-layer / fleece",
        category: "clothing",
        essential: true,
        source: "weather",
        reason: "Cool climate notes for this destination",
      }),
    );
  }
  if (/hot|heat|summer|sun|warm|tropical/.test(climate)) {
    weatherLines.push("Warm days → sun protection");
    items.push(
      item({
        id: "wx-sunscreen",
        label: "Sunscreen & lip balm",
        category: "health",
        source: "weather",
        reason: "Warm / sunny conditions expected",
      }),
      item({
        id: "wx-hat",
        label: "Sun hat or cap",
        category: "comfort",
        source: "weather",
        reason: "Shade for midday outdoor time",
      }),
    );
  }

  if (!weatherLines.length && !/hot|cold|rain|mild/.test(climate)) {
    items.push(
      item({
        id: "wx-sunscreen-default",
        label: "Sunscreen & lip balm",
        category: "health",
        source: "weather",
        reason: `Daylight outdoors in ${destination}`,
      }),
    );
  }

  for (const [index, extra] of prefs.extras.entries()) {
    const label = extra.trim();
    if (!label) continue;
    items.push(
      item({
        id: `extra-${index + 1}`,
        label,
        category: "personal",
        source: "preference",
        reason: "From your packing preferences",
      }),
    );
  }

  const seen = new Set<string>();
  const unique = items.filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });

  const interestChip = input.interests.slice(0, 2).join(", ") || "Culture";
  const tripSummary =
    meta?.tripSummary ||
    `${destination} · ${duration} · ${interestChip}`;

  return {
    items: unique.slice(0, 100),
    preferences: prefs,
    generatedAt: new Date().toISOString(),
    tripSummary,
    contextFingerprint: meta?.fingerprint,
    insights: {
      weather: weatherLines.slice(0, 6),
      activity: activityLines.slice(0, 6),
      itineraryAddedCount: itineraryAdded,
    },
  };
}

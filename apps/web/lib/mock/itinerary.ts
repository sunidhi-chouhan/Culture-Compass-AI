import type {
  CompassPlanResponse,
  ItineraryRequest,
  ItinerarySlot,
  TripItinerary,
} from "@culturecompass/shared";
import { parseDurationToDayCount } from "@/lib/itinerary/parse-duration-days";

const DAY_PARTS = ["morning", "afternoon", "evening"] as const;

const PART_TIMES: Record<(typeof DAY_PARTS)[number], string> = {
  morning: "09:00",
  afternoon: "13:30",
  evening: "18:30",
};

const PART_DURATION: Record<(typeof DAY_PARTS)[number], number> = {
  morning: 90,
  afternoon: 120,
  evening: 90,
};

const PART_TRANSIT: Record<(typeof DAY_PARTS)[number], number | undefined> = {
  morning: 20,
  afternoon: 15,
  evening: undefined,
};

const DAY_THEMES = [
  "Cultural discovery",
  "Local rhythms",
  "Heritage & craft",
  "Flavours & markets",
  "Quiet corners",
  "City light",
  "Neighbourhood walk",
];

type SlotTemplate = {
  tags: string[];
  category: string;
  titleFromPlace: (place: string) => string;
  description: (place: string, destination: string) => string;
};

const TEMPLATES: Record<(typeof DAY_PARTS)[number], SlotTemplate[]> = {
  morning: [
    {
      tags: ["Food", "Local life"],
      category: "food",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Explore the morning stalls at ${place} and taste what locals grab before the day opens.`,
    },
    {
      tags: ["Heritage", "Architecture"],
      category: "sightseeing",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Arrive early at ${place} for softer light and quieter courtyards.`,
    },
    {
      tags: ["Culture", "Ritual"],
      category: "culture",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Start at ${place} while the neighbourhood is still waking — watch, listen, then wander.`,
    },
  ],
  afternoon: [
    {
      tags: ["Nature", "Photography"],
      category: "sightseeing",
      titleFromPlace: (place) => place,
      description: (place) =>
        `A relaxed stretch at ${place} — pause for views, shade, and a slower afternoon pace.`,
    },
    {
      tags: ["History", "Architecture"],
      category: "sightseeing",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Spend the afternoon inside ${place} and follow the stories behind the main halls.`,
    },
    {
      tags: ["Craft", "Local life"],
      category: "experience",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Browse ${place} for makers and workshops — ask before you photograph stalls.`,
    },
  ],
  evening: [
    {
      tags: ["Food", "Night"],
      category: "food",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Settle into ${place} as evening crowds gather — share plates and stay for the atmosphere.`,
    },
    {
      tags: ["Culture", "Views"],
      category: "experience",
      titleFromPlace: (place) => place,
      description: (place) =>
        `End at ${place} when the light softens — a last look before you head back.`,
    },
    {
      tags: ["Music", "Local life"],
      category: "experience",
      titleFromPlace: (place) => place,
      description: (place) =>
        `Drift through ${place} after dark for street energy without a packed agenda.`,
    },
  ],
};

function placePool(destination: string, plan?: CompassPlanResponse | null): string[] {
  const fromPlan = [
    ...(plan?.attractions.map((a) => a.name) ?? []),
    ...(plan?.hiddenGems.map((g) => g.name) ?? []),
  ];
  if (fromPlan.length >= 3) return fromPlan;
  return [
    `${destination} Central Market`,
    `${destination} Riverside Walk`,
    `${destination} Heritage Museum`,
    `${destination} Old Town`,
    `${destination} Evening Square`,
    `${destination} Artisan Lane`,
    ...fromPlan,
  ];
}

function pickTemplate(
  part: (typeof DAY_PARTS)[number],
  dayNumber: number,
  index: number,
): SlotTemplate {
  const list = TEMPLATES[part];
  return list[(dayNumber + index) % list.length];
}

function buildSlot(
  dayNumber: number,
  part: (typeof DAY_PARTS)[number],
  index: number,
  destination: string,
  places: string[],
): ItinerarySlot {
  const place = places[(dayNumber * 3 + index) % places.length];
  const template = pickTemplate(part, dayNumber, index);
  const featured = index === 0;

  return {
    id: `d${dayNumber}-${part}`,
    dayPart: part,
    timeLabel: PART_TIMES[part],
    title: template.titleFromPlace(place),
    description: template.description(place, destination),
    placeName: place,
    category: template.category,
    durationMinutes: PART_DURATION[part],
    travelMinutesToNext: PART_TRANSIT[part],
    tags: template.tags,
    featured,
    imageSeed: place.toLowerCase().replace(/\s+/g, "-").slice(0, 80),
  };
}

export function getMockItinerary(
  input: ItineraryRequest,
  plan?: CompassPlanResponse | null,
): TripItinerary {
  const dayCount = parseDurationToDayCount(input.duration);
  const places = placePool(input.destination, plan);
  const days = Array.from({ length: dayCount }, (_, i) => {
    const dayNumber = i + 1;
    const theme = DAY_THEMES[(dayNumber - 1) % DAY_THEMES.length];
    return {
      dayNumber,
      title: `Day ${dayNumber}`,
      summary: `${theme} · ${input.destination}`,
      slots: DAY_PARTS.map((part, index) =>
        buildSlot(dayNumber, part, index, input.destination, places),
      ),
    };
  });

  return {
    days,
    notes: `Paced schedule for ${input.destination} — adjust times to open hours and weather.`,
    generatedAt: new Date().toISOString(),
  };
}

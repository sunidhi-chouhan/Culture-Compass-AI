import type { ItineraryRequest, TripItinerary } from "@culturecompass/shared";

export type EvalCaseMode = "generate" | "improve";

export interface EvalCase {
  id: string;
  destination: string;
  duration: string;
  interests: string[];
  travelStyle: string;
  budget: string;
  twist: string;
  /** generate = mock itinerary; improve = start from fixture (E09) or generate then TripMate. */
  mode: EvalCaseMode;
  expectedDays: number;
  /** Optional deliberately bad schedule (E09). */
  seedItinerary?: TripItinerary;
}

/** Rome morning overload — three museums, no lunch buffer (E09). */
export const BAD_ROME_SCHEDULE: TripItinerary = {
  days: [
    {
      dayNumber: 1,
      title: "Impossible morning",
      summary: "Three major museums stacked without gaps",
      slots: [
        {
          id: "rome-bad-1",
          dayPart: "morning",
          timeLabel: "09:00",
          title: "Colosseum",
          description: "Rush the Colosseum with no queue buffer.",
          placeName: "Colosseum",
          category: "sightseeing",
          durationMinutes: 120,
          travelMinutesToNext: 5,
          tags: ["History"],
          featured: true,
        },
        {
          id: "rome-bad-2",
          dayPart: "morning",
          timeLabel: "09:30",
          title: "Vatican Museums",
          description: "Cross the city to the Vatican with no lunch.",
          placeName: "Vatican Museums",
          category: "sightseeing",
          durationMinutes: 180,
          travelMinutesToNext: 8,
          tags: ["History", "Heritage"],
          featured: true,
        },
        {
          id: "rome-bad-3",
          dayPart: "morning",
          timeLabel: "10:00",
          title: "Borghese Gallery",
          description: "Third museum before noon — no rest.",
          placeName: "Galleria Borghese",
          category: "sightseeing",
          durationMinutes: 150,
          travelMinutesToNext: 5,
          tags: ["History"],
          featured: false,
        },
      ],
    },
    {
      dayNumber: 2,
      title: "Still rushed",
      summary: "Dense afternoon with long gap then pile-up",
      slots: [
        {
          id: "rome-bad-4",
          dayPart: "afternoon",
          timeLabel: "13:00",
          title: "Roman Forum",
          description: "Walk the Forum quickly.",
          placeName: "Roman Forum",
          category: "sightseeing",
          durationMinutes: 90,
          travelMinutesToNext: 50,
          tags: ["History"],
          featured: false,
        },
        {
          id: "rome-bad-5",
          dayPart: "evening",
          timeLabel: "18:00",
          title: "Trastevere stroll",
          description: "Evening neighbourhood walk.",
          placeName: "Trastevere",
          category: "culture",
          durationMinutes: 90,
          tags: ["Food", "Local life"],
          featured: false,
        },
      ],
    },
  ],
  notes: "Intentionally unrealistic for TripMate eval",
  generatedAt: "2026-08-29T08:00:00.000Z",
};

export const EVAL_CASES: EvalCase[] = [
  {
    id: "E01",
    destination: "Jaipur",
    duration: "3 Days",
    interests: ["History", "Food"],
    travelStyle: "solo",
    budget: "₹₹ Comfortable",
    twist: "Classic tourist overload risk",
    mode: "generate",
    expectedDays: 3,
  },
  {
    id: "E02",
    destination: "Kyoto",
    duration: "1 Week",
    interests: ["Heritage", "Nature"],
    travelStyle: "relaxed",
    budget: "₹₹₹ Premium",
    twist: "Temple clustering / overpack",
    mode: "generate",
    expectedDays: 7,
  },
  {
    id: "E03",
    destination: "Bali",
    duration: "Weekend",
    interests: ["Festivals", "Photography"],
    travelStyle: "adventurous",
    budget: "₹₹ Comfortable",
    twist: "Too short for ambitions",
    mode: "generate",
    expectedDays: 2,
  },
  {
    id: "E04",
    destination: "Istanbul",
    duration: "3 Days",
    interests: ["Food", "Architecture"],
    travelStyle: "solo",
    budget: "₹₹ Comfortable",
    twist: "Dense walkable core (Fatih)",
    mode: "generate",
    expectedDays: 3,
  },
  {
    id: "E05",
    destination: "Rome",
    duration: "3 Days",
    interests: ["History", "Food"],
    travelStyle: "family",
    budget: "₹₹ Comfortable",
    twist: "Classic overscheduling",
    mode: "generate",
    expectedDays: 3,
  },
  {
    id: "E06",
    destination: "Kerala",
    duration: "1 Week",
    interests: ["Nature", "Food"],
    travelStyle: "relaxed",
    budget: "₹ Budget-friendly",
    twist: "Travel between spots",
    mode: "generate",
    expectedDays: 7,
  },
  {
    id: "E07",
    destination: "Jaipur",
    duration: "3 Days",
    interests: ["Markets", "Food"],
    travelStyle: "solo",
    budget: "₹ Budget-friendly",
    twist: "Budget / companion constraint",
    mode: "generate",
    expectedDays: 3,
  },
  {
    id: "E08",
    destination: "Kyoto",
    duration: "3 Days",
    interests: ["Heritage"],
    travelStyle: "family",
    budget: "₹₹ Comfortable",
    twist: "Family pacing / etiquette",
    mode: "generate",
    expectedDays: 3,
  },
  {
    id: "E09",
    destination: "Rome",
    duration: "2 Days",
    interests: ["History"],
    travelStyle: "solo",
    budget: "₹₹ Comfortable",
    twist: "Existing bad schedule — TripMate must fix",
    mode: "improve",
    expectedDays: 2,
    seedItinerary: BAD_ROME_SCHEDULE,
  },
  {
    id: "E10",
    destination: "Indore",
    duration: "3 Days",
    interests: ["Food", "Festivals"],
    travelStyle: "solo",
    budget: "₹ Budget-friendly",
    twist: "Lesser-known destination — stay grounded",
    mode: "generate",
    expectedDays: 3,
  },
];

export function toItineraryRequest(evalCase: EvalCase): ItineraryRequest {
  return {
    destination: evalCase.destination,
    interests: evalCase.interests,
    duration: evalCase.duration,
    travelStyle: evalCase.travelStyle,
    budget: evalCase.budget,
    culturalContext: evalCase.twist,
  };
}

import type { CompassPlanRequest, CompassPlanResponse } from "@culturecompass/shared";

const DESTINATION_PRESETS: Record<
  string,
  { id: string; name: string; country: string; tagline: string }
> = {
  jaipur: {
    id: "jaipur",
    name: "Jaipur",
    country: "India",
    tagline: "The Pink City of Rajasthan",
  },
  kyoto: {
    id: "kyoto",
    name: "Kyoto",
    country: "Japan",
    tagline: "Ancient capital of temples and gardens",
  },
  bali: {
    id: "bali",
    name: "Bali",
    country: "Indonesia",
    tagline: "Island of temples, rice terraces, and ritual",
  },
};

function slugify(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function resolveDestination(input: CompassPlanRequest) {
  const raw = input.destination?.trim();
  if (!raw) {
    return DESTINATION_PRESETS.jaipur;
  }

  const key = slugify(raw);
  const preset = DESTINATION_PRESETS[key];
  if (preset) return preset;

  return {
    id: key || "jaipur",
    name: raw,
    country: "—",
    tagline: `Cultural journey through ${raw}`,
  };
}

function buildTouristPlan(dest: ReturnType<typeof resolveDestination>): CompassPlanResponse {
  const isJaipur = dest.id === "jaipur";

  const featured = {
    ...dest,
    rationale: isJaipur
      ? "A living canvas of palaces, bazaars, and desert light — perfect for first-time visitors."
      : `A rich cultural destination aligned with your interests in ${dest.name}.`,
    bestTimeToVisit: isJaipur ? "October – March" : "Spring or autumn",
    estimatedBudget: "$900–$1,400",
  };

  const attractions = isJaipur
    ? [
        {
          name: "Amber Fort",
          description: "Hilltop fortress with mirrored halls and elephant courtyard.",
          category: "landmark",
          tip: "Arrive before 9 AM to beat the crowds.",
        },
        {
          name: "Hawa Mahal",
          description: "Iconic pink facade with 953 lattice windows.",
          category: "architecture",
          tip: "Best photographed at sunrise from the street.",
        },
        {
          name: "City Palace",
          description: "Royal residence blending Rajput and Mughal architecture.",
          category: "heritage",
          tip: "Combine with Jantar Mantar on the same ticket.",
        },
        {
          name: "Jantar Mantar",
          description: "UNESCO astronomical observatory with massive stone instruments.",
          category: "science",
          tip: "Hire a guide to decode the sundials.",
        },
      ]
    : [
        {
          name: `${dest.name} Heritage Quarter`,
          description: "The historic heart every visitor should explore.",
          category: "landmark",
          tip: "Start early for the best light.",
        },
        {
          name: `${dest.name} National Museum`,
          description: "Flagship collection of regional art and history.",
          category: "museum",
          tip: "Allow at least two hours.",
        },
        {
          name: `${dest.name} Old Town`,
          description: "Walkable district of monuments and markets.",
          category: "heritage",
          tip: "Wear comfortable shoes.",
        },
        {
          name: `${dest.name} Cultural Center`,
          description: "Signature institution showcasing local traditions.",
          category: "culture",
          tip: "Check the performance schedule.",
        },
      ];

  return {
    destinations: [featured, { ...DESTINATION_PRESETS.kyoto, rationale: "Temples and tea", bestTimeToVisit: "Spring", estimatedBudget: "$1,500", tagline: DESTINATION_PRESETS.kyoto.tagline }],
    featuredDestination: featured,
    attractions,
    hiddenGems: [
      {
        name: isJaipur ? "Anokhi Museum" : "Neighborhood Gallery",
        description: "Quiet craft heritage away from the main sights.",
        whyVisit: "Worth a detour from the tourist circuit.",
        localTip: "Visit on a weekday morning.",
      },
      {
        name: isJaipur ? "Ghat ki Guni" : "Hidden Alley",
        description: "Painted passage locals use daily.",
        whyVisit: "Authentic atmosphere without tour groups.",
        localTip: "Late afternoon light is magical.",
      },
      {
        name: isJaipur ? "Galta Ji" : "Hillside Shrine",
        description: "Temple complex with resident monkeys and valley views.",
        whyVisit: "Spiritual and scenic.",
        localTip: "Bring water — it's a climb.",
      },
    ],
    heritage: {
      highlights: isJaipur
        ? ["Rajput architecture", "Block printing", "Desert cuisine"]
        : ["Local traditions", "Historic districts", "Living crafts"],
      traditions: isJaipur
        ? ["Tie-and-dye textiles", "Folk music at festivals"]
        : ["Seasonal festivals", "Artisan guilds"],
      etiquetteTips: ["Dress modestly at temples", "Bargain politely in bazaars"],
      culturalSignificance: isJaipur
        ? "Jaipur was planned as India's first walled city by Maharaja Sawai Jai Singh II."
        : `${dest.name} preserves centuries of cultural identity and community ritual.`,
    },
    events: [
      {
        name: isJaipur ? "Teej Festival" : "Harvest Festival",
        date: "Seasonal",
        description: "Colorful procession with music and traditional dress.",
        location: "Old City",
      },
      {
        name: isJaipur ? "Kite Festival" : "Cultural Fair",
        date: "January",
        description: "Citywide celebration drawing visitors from afar.",
        location: "Citywide",
      },
      {
        name: isJaipur ? "Gangaur" : "Street Parade",
        date: "Spring",
        description: "Community procession honoring local deities.",
        location: "Historic quarter",
      },
    ],
    experiences: [
      {
        name: isJaipur ? "Blue Pottery Workshop" : "Craft Workshop",
        description: "Hands-on session with a master artisan.",
        type: "artisan workshop",
        duration: "2 hours",
        authenticityNote: "Family-run studio open to visitors.",
      },
      {
        name: isJaipur ? "Heritage Food Walk" : "Local Food Tour",
        description: "Taste street food and regional specialties.",
        type: "food tour",
        duration: "3 hours",
        authenticityNote: "Led by a resident food guide.",
      },
      {
        name: isJaipur ? "Sunset at Nahargarh" : "Sunset Viewpoint",
        description: "Panoramic views over the old city.",
        type: "viewpoint",
        duration: "1.5 hours",
        authenticityNote: "Where locals watch the day end.",
      },
    ],
    storySnippet: {
      title: isJaipur ? "Dawn Over the Pink City" : `Arrival in ${dest.name}`,
      preview: isJaipur
        ? "You arrive in Jaipur just as the morning sun paints the Pink City in shades of gold."
        : `You step into ${dest.name} and the city greets you like an old friend.`,
      narrative: isJaipur
        ? "You arrive in Jaipur just as the morning sun paints the Pink City in shades of gold. The air smells of cardamom and dust and something sweet from a corner halwai. Rickshaws weave past havelis washed in rose quartz, and somewhere a tabla rhythm drifts from an open courtyard. You follow the murmur of the bazaar to Johari Bazaar, where saris shimmer like captured sunsets. A shopkeeper offers chai without being asked — the city, you realize, has been waiting for you. By afternoon you wander into a pottery lane where blue glaze cools on terracotta wheels. At Nahargarh, the whole city blushes pink again as the sun sets. Jaipur does not show itself all at once; it reveals itself, layer by layer, like the frescoes in Amber Fort."
        : `You arrive in ${dest.name} as morning light spills across rooftops and market awnings. The streets hum with vendors calling out prices and children laughing on their way to school. You pause at a corner café where an elder reads the newspaper beside a steaming cup. Every doorway seems to hold a story — a craftsman bent over his work, a musician tuning a string, a grandmother teaching a recipe passed down for generations. By evening the city transforms again: lanterns glow, aromas deepen, and you understand why travelers return here again and again. ${dest.name} is not a place you visit once; it is a place that visits you, quietly, and stays.`,
      tone: "immersive",
    },
    dashboard: {
      weather: isJaipur ? "Dry & sunny · 28°C average" : "Mild · 22°C average",
      culturalRating: 9.4,
      aiMatchScore: 94,
      foodHighlights: isJaipur
        ? ["Pyaaz kachori", "Dal baati churma", "Lassi at Lassiwala"]
        : ["Street noodles", "Market dumplings", "Regional specialty"],
      localTips: [
        "Visit main sights early",
        "Carry cash for local markets",
        "Book guides at official counters",
      ],
      shoppingGuide: isJaipur
        ? ["Johari Bazaar for jewelry", "Bapu Bazaar for textiles", "Anokhi for block prints"]
        : ["Central market for crafts", "Artisan lane for souvenirs", "Night bazaar for spices"],
    },
  };
}

function buildLocalPlan(dest: ReturnType<typeof resolveDestination>): CompassPlanResponse {
  const base = buildTouristPlan(dest);
  const isJaipur = dest.id === "jaipur";

  return {
    ...base,
    attractions: isJaipur
      ? [
          {
            name: "Neighborhood Hanuman Temple",
            description: "Small shrine where residents begin their day with bells and incense.",
            category: "neighborhood temple",
            tip: "Visit at dawn for the morning aarti.",
          },
          {
            name: "Masala Chai Stall, Chandpole",
            description: "Hole-in-the-wall chai spot locals queue for daily.",
            category: "hidden cafe",
            tip: "Order the kadak chai — no menu needed.",
          },
          {
            name: "Ramganj Spice Market",
            description: "Wholesale spice lanes where home cooks shop.",
            category: "market",
            tip: "Buy small quantities — vendors are generous with samples.",
          },
          {
            name: "Kishanpole Blue Pottery Lane",
            description: "Workshop row where artisans shape Jaipur blue pottery.",
            category: "artisan workshop",
            tip: "Ask to watch the glazing process.",
          },
        ]
      : [
          {
            name: "Morning Market Alley",
            description: "Where residents buy produce before tourists wake up.",
            category: "market",
            tip: "Go before 8 AM.",
          },
          {
            name: "Corner Temple Courtyard",
            description: "Neighborhood shrine with daily community gatherings.",
            category: "neighborhood temple",
            tip: "Remove shoes at the entrance.",
          },
          {
            name: "Family-Run Café",
            description: "Back-street coffee spot with no sign in English.",
            category: "hidden cafe",
            tip: "Ask what's fresh today.",
          },
          {
            name: "Artisan Cooperative",
            description: "Craft workshop staffed by local makers.",
            category: "artisan workshop",
            tip: "Weekday mornings are quietest.",
          },
        ],
    hiddenGems: [
      {
        name: isJaipur ? "Polo Bar Courtyard" : "Alley Kitchen",
        description: "Courtyard café behind the main bazaar — locals' morning ritual.",
        whyVisit: "Authentic daily life, not a tourist trap.",
        localTip: "Masala chai and kachori before 9 AM.",
      },
      {
        name: isJaipur ? "Sireh Deori Bazaar" : "Wholesale Market",
        description: "Wholesale textile market locals use for festival shopping.",
        whyVisit: "Real prices, real characters.",
        localTip: "Bargain with a smile.",
      },
      {
        name: isJaipur ? "Ghat ki Guni Tunnel" : "Painted Passage",
        description: "Painted tunnel alley residents shortcut through daily.",
        whyVisit: "Completely off the guidebook radar.",
        localTip: "Best light at late afternoon.",
      },
    ],
    experiences: [
      {
        name: isJaipur ? "Street Food Circuit" : "Market Food Walk",
        description: "Pyaaz kachori, mirchi vada, and lassi from vendors locals swear by.",
        type: "street food",
        duration: "2 hours",
        authenticityNote: "No tourist menus — point and eat.",
      },
      {
        name: isJaipur ? "Block Print Studio Visit" : "Craft Circle",
        description: "Watch artisans block-print fabric using techniques unchanged for centuries.",
        type: "artisan workshop",
        duration: "2 hours",
        authenticityNote: "Family workshop — generations of printers.",
      },
      {
        name: isJaipur ? "Community Teej Gathering" : "Neighborhood Festival",
        description: "Join residents at a local Teej celebration with swings and folk song.",
        type: "community festival",
        duration: "Half day",
        authenticityNote: "Not ticketed — arrive as a respectful guest.",
      },
    ],
    events: [
      {
        name: isJaipur ? "Johari Bazaar Morning Rush" : "Dawn Market",
        description: "The daily rhythm of traders opening stalls at first light.",
        location: "Old City",
        date: "Every morning",
      },
      {
        name: isJaipur ? "Waxing Moon Temple Fair" : "Courtyard Music Night",
        description: "Small neighborhood gathering around a local shrine.",
        location: "Residential quarter",
        date: "Monthly",
      },
      {
        name: isJaipur ? "Artisan Cooperative Open Day" : "Craft Fair",
        description: "Local makers sell directly — no middlemen.",
        location: "Craft district",
        date: "Weekends",
      },
    ],
    storySnippet: {
      ...base.storySnippet,
      title: isJaipur ? "A Resident's Jaipur" : `Living in ${dest.name}`,
      preview: "Recommendations generated from the perspective of a local resident.",
      narrative: isJaipur
        ? "You wake before the tourists — the Pink City belongs to you for an hour. The chai-wallah at Chandpole already knows your order. You cut through Ghat ki Guni, past frescoes tourists never photograph, and pause at the neighborhood temple where your neighbor is sweeping the courtyard. At Ramganj market you haggle for saffron with a vendor who remembers your grandmother. Lunch is pyaaz kachori from the stall that has no name, only a queue of people who live here. In the afternoon you visit the block-print studio where your friend works — the patterns are the same ones his father carved. By evening you are at a community Teej gathering, not a ticketed spectacle but women on swings singing songs your mother taught you. This is Jaipur the guidebooks miss — not less beautiful, but more true."
        : `You wake early because that is what locals do. The market is yours before the tour buses arrive. You know which stall has the best broth, which alley shortcut saves ten minutes, which temple courtyard stays cool at noon. Shopkeepers greet you by name. In the afternoon you visit a workshop where a friend throws clay — tourists pay for classes, you come for conversation. Evening brings a neighborhood festival: not advertised online, just word of mouth and lanterns strung between balconies. ${dest.name} is not a destination you consume. It is a rhythm you learn — and once you learn it, every street feels like home.`,
    },
    dashboard: {
      ...base.dashboard!,
      localTips: isJaipur
        ? [
            "Skip Johari at noon — go at 7 AM with residents",
            "Eat where you see office workers queueing",
            "Ask artisans if you can watch before you buy",
          ]
        : ["Follow the morning market crowd", "Eat where locals eat", "Learn three words of the local language"],
      foodHighlights: isJaipur
        ? ["Pyaaz kachori at Rawat", "Mirchi vada at street stalls", "Kulfi on MI Road"]
        : ["Morning market snacks", "Family-run noodle shop", "Night hawker favorites"],
      shoppingGuide: isJaipur
        ? ["Sireh Deori for wholesale textiles", "Kishanpole for pottery", "Bapu Bazaar on weekdays"]
        : ["Wholesale market mornings", "Artisan cooperative", "Residential craft lane"],
    },
  };
}

export function isMockAiEnabled(): boolean {
  return process.env.USE_MOCK_AI === "true";
}

export function getMockCompassPlan(input: CompassPlanRequest): CompassPlanResponse {
  const dest = resolveDestination(input);
  return input.lensMode === "local" ? buildLocalPlan(dest) : buildTouristPlan(dest);
}

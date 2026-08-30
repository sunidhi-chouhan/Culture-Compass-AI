import type { CompassPlanResponse, DashboardMeta } from "@culturecompass/shared";

export type DashboardCardId =
  | "hidden-gems"
  | "heritage"
  | "food"
  | "events"
  | "story"
  | "budget"
  | "local-tips"
  | "shopping"
  | "etiquette";

export interface DashboardBullet {
  text: string;
  placeName?: string;
  locationName?: string;
}

export interface DashboardCardContent {
  id: DashboardCardId;
  title: string;
  summary: string;
  bullets: DashboardBullet[];
  footer?: string;
}

export function getDestinationHeroUrl(destinationId: string): string {
  return `https://picsum.photos/seed/${encodeURIComponent(destinationId)}/1600/900`;
}

function hashScore(seed: string, min: number, max: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const range = max - min + 1;
  return min + (Math.abs(hash) % range);
}

export function resolveDashboardMeta(plan: CompassPlanResponse): DashboardMeta {
  if (plan.dashboard) {
    return plan.dashboard;
  }

  const dest = plan.featuredDestination;
  const foodFromAttractions = plan.attractions
    .filter((a) => /food|market|cuisine|restaurant|culinary/i.test(a.category + a.name))
    .map((a) => a.name);
  const foodFromExperiences = plan.experiences
    .filter((e) => /food|culinary|taste|market/i.test(e.type + e.name))
    .map((e) => e.name);
  const foodHighlights =
    [...new Set([...foodFromAttractions, ...foodFromExperiences])].slice(0, 5) ||
    plan.heritage.traditions.slice(0, 3);

  const localTips = [
    ...plan.hiddenGems.map((g) => g.localTip),
    ...plan.attractions.map((a) => a.tip),
  ].filter(Boolean).slice(0, 6);

  const shoppingGuide = plan.experiences
    .filter((e) => /market|craft|shop|artisan/i.test(e.type + e.description))
    .map((e) => e.name)
    .concat(plan.attractions.filter((a) => /market|bazaar|shop/i.test(a.category)).map((a) => a.name))
    .slice(0, 5);

  return {
    weather: `Pleasant seasonal climate · ideal during ${dest.bestTimeToVisit}`,
    culturalRating: Number((hashScore(dest.id, 82, 98) / 10).toFixed(1)),
    aiMatchScore: hashScore(dest.id + dest.name, 88, 99),
    foodHighlights: foodHighlights.length > 0 ? foodHighlights : ["Local street food", "Regional specialties", "Traditional markets"],
    localTips: localTips.length > 0 ? localTips : ["Visit early morning for fewer crowds", "Learn a few local phrases", "Ask locals for their favorite spots"],
    shoppingGuide: shoppingGuide.length > 0 ? shoppingGuide : ["Artisan markets", "Handcrafted souvenirs", "Local textile districts"],
  };
}

export function buildDashboardCards(plan: CompassPlanResponse): DashboardCardContent[] {
  const dest = plan.featuredDestination;
  const dashboard = resolveDashboardMeta(plan);

  return [
    {
      id: "hidden-gems",
      title: "Hidden Gems",
      summary: `${plan.hiddenGems.length} secret spots locals love`,
      bullets: plan.hiddenGems.map((g) => ({
        placeName: g.name,
        text: g.whyVisit,
      })),
    },
    {
      id: "heritage",
      title: "Heritage",
      summary: dest.tagline,
      bullets: plan.heritage.highlights.map((highlight) => ({ text: highlight })),
      footer: plan.heritage.culturalSignificance,
    },
    {
      id: "food",
      title: "Food",
      summary: "Taste the soul of the destination",
      bullets: dashboard.foodHighlights.map((name) => ({
        placeName: name,
        text: "A local favorite worth seeking out.",
      })),
    },
    {
      id: "events",
      title: "Events",
      summary: `${plan.events.length} cultural happenings`,
      bullets: plan.events.map((e) => ({
        placeName: e.name,
        locationName: e.location,
        text: `(${e.date}) — ${e.description}`,
      })),
    },
    {
      id: "story",
      title: "Story",
      summary: plan.storySnippet.title,
      bullets: [{ text: plan.storySnippet.preview }],
      footer: `${plan.storySnippet.tone} narrative`,
    },
    {
      id: "budget",
      title: "Budget",
      summary: dest.estimatedBudget,
      bullets: [
        { text: `Estimated trip cost: ${dest.estimatedBudget}` },
        { text: `Best season: ${dest.bestTimeToVisit}` },
        { text: dest.rationale },
      ],
    },
    {
      id: "local-tips",
      title: "Local Tips",
      summary: "Insider wisdom from JourneyMind",
      bullets: dashboard.localTips.map((tip) => ({ text: tip })),
    },
    {
      id: "shopping",
      title: "Shopping",
      summary: "Markets & treasures to bring home",
      bullets: dashboard.shoppingGuide.map((name) => ({
        placeName: name,
        text: "Where locals shop for quality and character.",
      })),
    },
    {
      id: "etiquette",
      title: "Etiquette",
      summary: "Respect local customs",
      bullets: plan.heritage.etiquetteTips.map((tip) => ({ text: tip })),
      footer: plan.heritage.traditions.length
        ? `Traditions: ${plan.heritage.traditions.join(" · ")}`
        : undefined,
    },
  ];
}

import type { CompassPlanResponse, StorySnippet } from "@culturecompass/shared";
import { resolveDashboardMeta } from "@/lib/dashboard-helpers";

export interface StoryToken {
  word: string;
  start: number;
}

export function tokenizeNarrative(text: string): StoryToken[] {
  const tokens: StoryToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    tokens.push({ word: match[0], start: match.index });
  }
  return tokens;
}

export function charIndexToWordIndex(tokens: StoryToken[], charIndex: number): number {
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (charIndex >= tokens[i].start) return i;
  }
  return 0;
}

export function getStoryNarrative(snippet: StorySnippet): string {
  return snippet.narrative?.trim() || snippet.preview;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Split narrative into speakable chunks so long journeys don't hit browser utterance limits. */
export function chunkNarrativeForSpeech(text: string, maxChars = 280): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) ?? [trimmed];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = sentence.trim();
    if (!next) continue;
    if (current.length === 0) {
      current = next;
      continue;
    }
    if (current.length + 1 + next.length <= maxChars) {
      current = `${current} ${next}`;
    } else {
      chunks.push(current);
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

export function buildJourneyNarration(plan: CompassPlanResponse): string {
  const dest = plan.featuredDestination;
  const dashboard = resolveDashboardMeta(plan);
  const sections: string[] = [];

  const storyText = getStoryNarrative(plan.storySnippet);
  if (storyText) {
    sections.push(storyText);
  }

  if (plan.hiddenGems.length > 0) {
    sections.push(`Hidden gems in ${dest.name}.`);
    for (const gem of plan.hiddenGems) {
      sections.push(`${gem.name}. ${gem.description}. ${gem.whyVisit}.`);
      if (gem.localTip) {
        sections.push(`Local tip: ${gem.localTip}.`);
      }
    }
  }

  sections.push(`Heritage of ${dest.name}.`);
  if (plan.heritage.highlights.length > 0) {
    sections.push(`Highlights include ${plan.heritage.highlights.join(", ")}.`);
  }
  if (plan.heritage.culturalSignificance) {
    sections.push(plan.heritage.culturalSignificance);
  }
  if (plan.heritage.traditions.length > 0) {
    sections.push(`Traditions: ${plan.heritage.traditions.join(", ")}.`);
  }

  if (dashboard.foodHighlights.length > 0) {
    sections.push(`Food to taste in ${dest.name}.`);
    for (const food of dashboard.foodHighlights) {
      sections.push(`${food}.`);
    }
  }

  if (plan.events.length > 0) {
    sections.push("Cultural events.");
    for (const event of plan.events) {
      sections.push(`${event.name}, ${event.date} at ${event.location}. ${event.description}.`);
    }
  }

  if (dashboard.localTips.length > 0) {
    sections.push("Local tips from JourneyMind.");
    for (const tip of dashboard.localTips) {
      sections.push(tip);
    }
  }

  if (dashboard.shoppingGuide.length > 0) {
    sections.push("Shopping guide.");
    for (const shop of dashboard.shoppingGuide) {
      sections.push(`${shop}.`);
    }
  }

  if (plan.heritage.etiquetteTips.length > 0) {
    sections.push("Etiquette tips.");
    for (const tip of plan.heritage.etiquetteTips) {
      sections.push(tip);
    }
  }

  if (plan.attractions.length > 0) {
    sections.push("Notable attractions.");
    for (const attraction of plan.attractions) {
      sections.push(`${attraction.name}. ${attraction.description}.`);
    }
  }

  if (plan.experiences.length > 0) {
    sections.push("Authentic experiences.");
    for (const experience of plan.experiences) {
      sections.push(`${experience.name}. ${experience.description}.`);
    }
  }

  sections.push(
    `Plan your budget around ${dest.estimatedBudget}. Best time to visit: ${dest.bestTimeToVisit}.`,
  );

  return sections.filter(Boolean).join(" ");
}

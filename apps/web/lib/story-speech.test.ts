import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  tokenizeNarrative,
  charIndexToWordIndex,
  getStoryNarrative,
  buildJourneyNarration,
  chunkNarrativeForSpeech,
} from "./story-speech";
import type { CompassPlanResponse } from "@culturecompass/shared";

describe("story speech helpers", () => {
  it("tokenizes narrative into words with start indices", () => {
    const tokens = tokenizeNarrative("You arrive in Jaipur.");
    assert.equal(tokens.length, 4);
    assert.equal(tokens[0].word, "You");
    assert.equal(tokens[0].start, 0);
    assert.equal(tokens[2].word, "in");
    assert.equal(tokens[2].start, 11);
  });

  it("maps char index to word index", () => {
    const text = "Hello beautiful world";
    const tokens = tokenizeNarrative(text);
    assert.equal(charIndexToWordIndex(tokens, 0), 0);
    assert.equal(charIndexToWordIndex(tokens, 6), 1);
    assert.equal(charIndexToWordIndex(tokens, 16), 2);
  });

  it("prefers narrative over preview", () => {
    const narrative = getStoryNarrative({
      title: "T",
      preview: "Short",
      narrative: "Long immersive story",
      tone: "immersive",
    });
    assert.equal(narrative, "Long immersive story");
  });

  it("falls back to preview when narrative is empty", () => {
    const narrative = getStoryNarrative({
      title: "T",
      preview: "Fallback preview",
      narrative: "   ",
      tone: "immersive",
    });
    assert.equal(narrative, "Fallback preview");
  });

  it("builds a full journey narration in logical order", () => {
    const plan = {
      featuredDestination: {
        id: "istanbul",
        name: "Fatih, Istanbul",
        country: "Turkey",
        tagline: "Cultural heart",
        rationale: "Rich history",
        bestTimeToVisit: "Spring or autumn",
        estimatedBudget: "$900 - $1,400",
      },
      hiddenGems: [
        {
          name: "Alley Kitchen",
          description: "Courtyard café",
          whyVisit: "Locals' morning ritual",
          localTip: "Arrive before 9 AM",
        },
      ],
      heritage: {
        highlights: ["Historic mosques"],
        traditions: ["Tea culture"],
        etiquetteTips: ["Dress modestly in mosques"],
        culturalSignificance: "Crossroads of empires",
      },
      events: [
        {
          name: "Neighborhood Festival",
          date: "August",
          description: "Community celebration",
          location: "Fatih",
        },
      ],
      attractions: [{ name: "Grand Bazaar", description: "Historic market", category: "market", tip: "Go early" }],
      experiences: [{ name: "Craft Circle", description: "Block printing", type: "workshop", duration: "2h", authenticityNote: "Local artisans" }],
      storySnippet: {
        title: "Living in Fatih",
        preview: "You wake early...",
        narrative: "You wake early because that is what locals do.",
        tone: "immersive",
      },
    } as CompassPlanResponse;

    const narration = buildJourneyNarration(plan);
    assert.match(narration, /You wake early because that is what locals do/);
    assert.match(narration, /Hidden gems in Fatih, Istanbul/);
    assert.match(narration, /Alley Kitchen/);
    assert.match(narration, /Heritage of Fatih, Istanbul/);
    assert.match(narration, /Food to taste/);
    assert.match(narration, /Neighborhood Festival/);
    assert.match(narration, /Etiquette tips/);
    assert.match(narration, /Grand Bazaar/);
    assert.match(narration, /Craft Circle/);
    assert.match(narration, /\$900 - \$1,400/);
  });

  it("chunks long narration for speech playback", () => {
    const text =
      "First sentence here. Second sentence follows. Third one wraps up the thought nicely.";
    const chunks = chunkNarrativeForSpeech(text, 40);
    assert.ok(chunks.length >= 2);
    assert.match(chunks.join(" "), /First sentence/);
  });

  it("returns no chunks for blank narration", () => {
    assert.deepEqual(chunkNarrativeForSpeech("   "), []);
  });
});

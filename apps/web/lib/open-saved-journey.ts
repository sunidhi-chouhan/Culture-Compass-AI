import {
  JOURNEY_PACKING_SESSION_KEY,
  type SavedJourney,
} from "@culturecompass/shared";
import { requestFromSavedJourney } from "@/lib/build-saved-journey";
import { writeActiveJourneySession } from "@/lib/journey-library-storage";
import { clearSessionPacking, writeSessionPacking } from "@/lib/packing-session-storage";
import { writePlannerSession } from "@/lib/planner-session-storage";

/**
 * Loads a library journey into the active planner session (Explore-ready).
 */
export function openSavedJourneyIntoSession(
  journey: SavedJourney,
  sessionStorageLike: Pick<Storage, "setItem" | "removeItem">,
): void {
  const request = requestFromSavedJourney(journey);
  const plan = {
    ...journey.culturalPlan,
    itinerary: journey.itinerary ?? journey.culturalPlan.itinerary,
  };

  writePlannerSession(sessionStorageLike, plan, request);
  writeActiveJourneySession(sessionStorageLike, {
    activeJourneyId: journey.id,
    isDraft: false,
    updatedAt: new Date().toISOString(),
  });

  if (journey.packing) {
    writeSessionPacking(sessionStorageLike, journey.packing);
  } else {
    clearSessionPacking(sessionStorageLike);
  }
}

/** Exported for tests that assert the packing key clears with the session. */
export { JOURNEY_PACKING_SESSION_KEY };

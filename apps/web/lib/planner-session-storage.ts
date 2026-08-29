import type { CompassPlanRequest, CompassPlanResponse, LensMode } from "@culturecompass/shared";
import {
  ACTIVE_JOURNEY_SESSION_STORAGE_KEY,
  DEFAULT_LENS_MODE,
  JOURNEY_PACKING_SESSION_KEY,
} from "@culturecompass/shared";
import { PLANNER_LOCATION_STORAGE_KEY } from "@/lib/planner-location";

export const COMPASS_PLAN_STORAGE_KEY = "compassPlan";
export const COMPASS_REQUEST_STORAGE_KEY = "compassRequest";

export interface RestoredPlannerSession {
  plan: CompassPlanResponse;
  request: CompassPlanRequest;
  lensMode: LensMode;
}

export function readPlannerSession(storage: Pick<Storage, "getItem">): RestoredPlannerSession | null {
  const planRaw = storage.getItem(COMPASS_PLAN_STORAGE_KEY);
  const requestRaw = storage.getItem(COMPASS_REQUEST_STORAGE_KEY);
  if (!planRaw || !requestRaw) return null;

  try {
    const plan = JSON.parse(planRaw) as CompassPlanResponse;
    const request = JSON.parse(requestRaw) as CompassPlanRequest;
    return {
      plan,
      request,
      lensMode: request.lensMode ?? DEFAULT_LENS_MODE,
    };
  } catch {
    return null;
  }
}

/**
 * Clears the active planning/generation session so Start Exploring begins fresh.
 * Does not touch theme or the multi-journey library (localStorage).
 */
export function clearActivePlannerSession(
  storage: Pick<Storage, "removeItem">,
  options: { clearPlannerLocation?: boolean } = {},
): void {
  storage.removeItem(COMPASS_PLAN_STORAGE_KEY);
  storage.removeItem(COMPASS_REQUEST_STORAGE_KEY);
  storage.removeItem(ACTIVE_JOURNEY_SESSION_STORAGE_KEY);
  storage.removeItem(JOURNEY_PACKING_SESSION_KEY);
  if (options.clearPlannerLocation !== false) {
    storage.removeItem(PLANNER_LOCATION_STORAGE_KEY);
  }
}

export function writePlannerSession(
  storage: Pick<Storage, "setItem">,
  plan: CompassPlanResponse,
  request: CompassPlanRequest,
): void {
  storage.setItem(COMPASS_REQUEST_STORAGE_KEY, JSON.stringify(request));
  storage.setItem(COMPASS_PLAN_STORAGE_KEY, JSON.stringify(plan));
}

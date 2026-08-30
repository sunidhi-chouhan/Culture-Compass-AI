"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CompassPlanRequest,
  CompassPlanResponse,
  TripItinerary,
} from "@culturecompass/shared";
import { createItinerary } from "@/lib/api-client";
import { getDisplayError } from "@/lib/errors";
import { buildItineraryRequest } from "@/lib/itinerary/build-itinerary-request";
import { getMockItinerary } from "@/lib/mock/itinerary";
import type { ItineraryPanelStatus } from "@/components/itinerary/day-itinerary-panel";

const STATUS_LINES = [
  "Charting your days…",
  "Balancing pace and places…",
  "Shaping a schedule you can explore…",
];

interface UseJourneyItineraryOptions {
  plan: CompassPlanResponse | null;
  request: CompassPlanRequest | null;
  enabled: boolean;
  onItineraryReady?: (itinerary: TripItinerary) => void;
}

function requestKeyOf(request: CompassPlanRequest | null): string {
  if (!request) return "";
  return [
    request.destination ?? "",
    request.duration,
    request.interests.join(","),
    request.budget ?? "",
    request.travelStyle ?? "",
  ].join("|");
}

function resolveSeed(
  plan: CompassPlanResponse,
  request: CompassPlanRequest,
): TripItinerary {
  if (plan.itinerary?.days.length) return plan.itinerary;
  return getMockItinerary(buildItineraryRequest(request, plan), plan);
}

export function useJourneyItinerary({
  plan,
  request,
  enabled,
  onItineraryReady,
}: UseJourneyItineraryOptions) {
  const [itinerary, setItinerary] = useState<TripItinerary | null>(null);
  const [status, setStatus] = useState<ItineraryPanelStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusLineIndex, setStatusLineIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onReadyRef = useRef(onItineraryReady);
  onReadyRef.current = onItineraryReady;
  const planRef = useRef(plan);
  planRef.current = plan;
  const requestRef = useRef(request);
  requestRef.current = request;
  const seededKeyRef = useRef<string | null>(null);
  const fetchedKeyRef = useRef<string | null>(null);
  const inFlightRef = useRef(false);

  const requestKey = requestKeyOf(request);

  const persistIfNeeded = useCallback(
    (next: TripItinerary, sourcePlan: CompassPlanResponse) => {
      if (sourcePlan.itinerary?.days.length) return;
      onReadyRef.current?.(next);
    },
    [],
  );

  const runFetch = useCallback(async (force: boolean) => {
    const nextPlan = planRef.current;
    const nextRequest = requestRef.current;
    if (!nextPlan || !nextRequest) return;

    const key = requestKeyOf(nextRequest);
    if (!key) return;
    if (!force && fetchedKeyRef.current === key) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setIsRefreshing(true);

    try {
      const result = await createItinerary(buildItineraryRequest(nextRequest, nextPlan));
      if (!result.itinerary.days.length) {
        fetchedKeyRef.current = key;
        return;
      }
      fetchedKeyRef.current = key;
      setItinerary(result.itinerary);
      setStatus("ready");
      setErrorMessage(null);
      onReadyRef.current?.(result.itinerary);
    } catch (err) {
      setErrorMessage(getDisplayError(err));
      // Keep whatever days are already on screen (seed / plan).
      setStatus((prev) => (prev === "ready" ? prev : "ready"));
      if (!planRef.current?.itinerary?.days.length) {
        const seeded = resolveSeed(nextPlan, nextRequest);
        setItinerary(seeded);
        persistIfNeeded(seeded, nextPlan);
      }
    } finally {
      inFlightRef.current = false;
      setIsRefreshing(false);
    }
  }, [persistIfNeeded]);

  useEffect(() => {
    if (!enabled || !plan || !request || !requestKey) return;

    if (seededKeyRef.current !== requestKey) {
      const seeded = resolveSeed(plan, request);
      seededKeyRef.current = requestKey;
      setItinerary(seeded);
      setStatus("ready");
      setErrorMessage(null);
      persistIfNeeded(seeded, plan);
      void runFetch(false);
      return;
    }

    if (!itinerary?.days.length) {
      const seeded = resolveSeed(plan, request);
      setItinerary(seeded);
      setStatus("ready");
      persistIfNeeded(seeded, plan);
    }
  }, [enabled, requestKey, plan, request, itinerary?.days.length, persistIfNeeded, runFetch]);

  useEffect(() => {
    if (!isRefreshing) return;
    setStatusLineIndex(0);
    const id = window.setInterval(() => {
      setStatusLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, [isRefreshing]);

  return {
    itinerary,
    status,
    errorMessage,
    statusLine: STATUS_LINES[statusLineIndex],
    isRefreshing,
    retry: () => {
      fetchedKeyRef.current = null;
      void runFetch(true);
    },
    /** Replace the visible schedule (e.g. TripMate Apply) without refetching. */
    replaceItinerary: (next: TripItinerary) => {
      setItinerary(next);
      setStatus("ready");
      setErrorMessage(null);
      onReadyRef.current?.(next);
    },
  };
}

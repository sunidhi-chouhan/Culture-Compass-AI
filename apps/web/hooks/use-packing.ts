"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CompassPlanRequest,
  CompassPlanResponse,
  PackingItem,
  PackingList,
  PackingPreferences,
  TripItinerary,
} from "@culturecompass/shared";
import { createPackingList } from "@/lib/api-client";
import { getDisplayError } from "@/lib/errors";
import { getMockPackingList } from "@/lib/mock/packing";
import { buildTripPackingContext } from "@/lib/packing/build-trip-packing-context";
import { mergePackedState } from "@/lib/packing/merge-packed-state";
import {
  clearSessionPacking,
  readSessionPacking,
  writeSessionPacking,
} from "@/lib/packing-session-storage";

export type PackingStatus = "idle" | "loading" | "ready" | "error";

const STATUS_LINES = [
  "Reading your trip context…",
  "Matching gear to your days…",
  "Building a checklist you can tick…",
];

function createCustomItem(label: string): PackingItem {
  return {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: label.trim(),
    category: "personal",
    packed: false,
    essential: false,
    source: "personal",
    reason: "Added by you",
  };
}

interface UsePackingOptions {
  plan: CompassPlanResponse | null;
  request: CompassPlanRequest | null;
  itinerary?: TripItinerary | null;
}

export function usePacking({ plan, request, itinerary = null }: UsePackingOptions) {
  const [packing, setPacking] = useState<PackingList | null>(null);
  const [status, setStatus] = useState<PackingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusLineIndex, setStatusLineIndex] = useState(0);
  const [climateNotes, setClimateNotes] = useState("");
  const [activityNotes, setActivityNotes] = useState("");
  const [extraDraft, setExtraDraft] = useState("");
  const hydratedRef = useRef(false);
  const packingRef = useRef<PackingList | null>(null);
  packingRef.current = packing;

  const tripContext = useMemo(() => {
    if (!plan || !request) return null;
    return buildTripPackingContext({
      plan,
      request,
      itinerary,
      climateNotes,
      activityNotes,
    });
  }, [plan, request, itinerary, climateNotes, activityNotes]);

  const journeyStale = Boolean(
    packing?.contextFingerprint &&
      tripContext &&
      packing.contextFingerprint !== tripContext.fingerprint,
  );

  const persist = useCallback((next: PackingList) => {
    setPacking(next);
    if (typeof sessionStorage !== "undefined") {
      writeSessionPacking(sessionStorage, next);
    }
  }, []);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (typeof sessionStorage === "undefined") return;
    const restored = readSessionPacking(sessionStorage);
    if (restored?.items.length) {
      setPacking(restored);
      setStatus("ready");
      setClimateNotes(restored.preferences.climateNotes ?? "");
      setActivityNotes(restored.preferences.activityNotes ?? "");
    }
  }, []);

  useEffect(() => {
    if (status !== "loading") return;
    setStatusLineIndex(0);
    const id = window.setInterval(() => {
      setStatusLineIndex((i) => (i + 1) % STATUS_LINES.length);
    }, 1800);
    return () => window.clearInterval(id);
  }, [status]);

  const preferences = useCallback((): PackingPreferences => {
    const extras = packing?.preferences.extras ?? [];
    return {
      climateNotes: climateNotes.trim() || undefined,
      activityNotes: activityNotes.trim() || undefined,
      extras,
    };
  }, [packing?.preferences.extras, climateNotes, activityNotes]);

  const generate = useCallback(async () => {
    if (!plan || !request || !tripContext) return;

    const prefs = preferences();
    const payload = tripContext.toPackingRequest(prefs);

    setStatus("loading");
    setErrorMessage(null);

    const attachMeta = (list: PackingList): PackingList => ({
      ...list,
      tripSummary: list.tripSummary || tripContext.tripSummary,
      contextFingerprint: tripContext.fingerprint,
      preferences: {
        ...list.preferences,
        climateNotes: climateNotes.trim() || list.preferences.climateNotes,
        activityNotes: activityNotes.trim() || list.preferences.activityNotes,
      },
      insights: {
        weather:
          list.insights?.weather?.length
            ? list.insights.weather
            : tripContext.weatherInsightLines,
        activity:
          list.insights?.activity?.length
            ? list.insights.activity
            : tripContext.activityInsightLines,
        itineraryAddedCount:
          list.insights?.itineraryAddedCount ??
          list.items.filter((i) => i.source === "itinerary").length,
      },
    });

    try {
      const result = await createPackingList(payload);
      const merged = mergePackedState(packingRef.current, attachMeta(result.packing));
      persist(merged);
      setStatus("ready");
    } catch (err) {
      const fallback = getMockPackingList(payload, {
        fingerprint: tripContext.fingerprint,
        tripSummary: tripContext.tripSummary,
      });
      const merged = mergePackedState(packingRef.current, attachMeta(fallback));
      persist(merged);
      setErrorMessage(getDisplayError(err));
      setStatus("ready");
    }
  }, [plan, request, tripContext, preferences, persist, climateNotes, activityNotes]);

  const togglePacked = useCallback(
    (itemId: string) => {
      if (!packing) return;
      persist({
        ...packing,
        items: packing.items.map((item) =>
          item.id === itemId ? { ...item, packed: !item.packed } : item,
        ),
      });
    },
    [packing, persist],
  );

  const addExtra = useCallback(() => {
    const label = extraDraft.trim();
    if (!label) return;
    const extras = [...(packing?.preferences.extras ?? [])];
    if (!extras.includes(label) && extras.length < 20) extras.push(label);

    const nextItems = packing?.items ? [...packing.items] : [];
    if (!nextItems.some((i) => i.label.toLowerCase() === label.toLowerCase())) {
      nextItems.push(createCustomItem(label));
    }

    persist({
      items: nextItems,
      preferences: {
        climateNotes: climateNotes.trim() || undefined,
        activityNotes: activityNotes.trim() || undefined,
        extras,
      },
      generatedAt: packing?.generatedAt ?? new Date().toISOString(),
      tripSummary: packing?.tripSummary ?? tripContext?.tripSummary,
      insights: packing?.insights,
      contextFingerprint: packing?.contextFingerprint ?? tripContext?.fingerprint,
    });
    setExtraDraft("");
    setStatus("ready");
  }, [extraDraft, packing, climateNotes, activityNotes, persist, tripContext]);

  const reset = useCallback(() => {
    setPacking(null);
    setStatus("idle");
    setErrorMessage(null);
    if (typeof sessionStorage !== "undefined") {
      clearSessionPacking(sessionStorage);
    }
  }, []);

  const packedCount = packing?.items.filter((i) => i.packed).length ?? 0;
  const totalCount = packing?.items.length ?? 0;
  const essentialRemaining =
    packing?.items.filter((i) => i.essential && !i.packed).length ?? 0;

  return {
    packing,
    status,
    errorMessage,
    statusLine: STATUS_LINES[statusLineIndex],
    climateNotes,
    setClimateNotes,
    activityNotes,
    setActivityNotes,
    extraDraft,
    setExtraDraft,
    generate,
    togglePacked,
    addExtra,
    reset,
    packedCount,
    totalCount,
    essentialRemaining,
    tripSummary: packing?.tripSummary ?? tripContext?.tripSummary ?? null,
    destination: tripContext?.destination ?? null,
    journeyStale,
    canGenerate: Boolean(plan && request),
    isBusy: status === "loading",
  };
}

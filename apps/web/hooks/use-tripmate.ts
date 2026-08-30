"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CompassPlanRequest,
  CompassPlanResponse,
  TripItinerary,
  TripMateResult,
} from "@culturecompass/shared";
import { runTripMate } from "@/lib/api-client";
import { getDisplayError } from "@/lib/errors";
import { applySuggestion } from "@/lib/tripmate/apply-suggestion";
import {
  appendTripMateStage,
  startTripMateTrajectory,
} from "@/lib/tripmate/trajectories";
import { mockExtractFromUpload } from "@/lib/mock/tripmate";

export type TripMateAgentStatus =
  | "idle"
  | "running"
  | "verifying"
  | "done"
  | "failed";

export type TripMateAgentStepState = "pending" | "active" | "done";

export interface TripMateAgentStep {
  id: string;
  label: string;
  state: TripMateAgentStepState;
}

const AGENT_STEP_DEFS = [
  { id: "read", label: "Reading your itinerary" },
  { id: "conflicts", label: "Checking schedule conflicts" },
  { id: "pacing", label: "Reviewing day pacing" },
  { id: "opportunities", label: "Finding improvement opportunities" },
  { id: "prepare", label: "Preparing recommendations" },
] as const;

interface UseTripMateOptions {
  plan: CompassPlanResponse | null;
  request: CompassPlanRequest | null;
  itinerary: TripItinerary | null;
  onApplyImproved?: (itinerary: TripItinerary) => void;
}

function buildSteps(activeIndex: number, complete: boolean): TripMateAgentStep[] {
  return AGENT_STEP_DEFS.map((step, i) => ({
    id: step.id,
    label: step.label,
    state: complete
      ? "done"
      : i < activeIndex
        ? "done"
        : i === activeIndex
          ? "active"
          : "pending",
  }));
}

export function useTripMate({
  plan,
  request,
  itinerary,
  onApplyImproved,
}: UseTripMateOptions) {
  const [status, setStatus] = useState<TripMateAgentStatus>("idle");
  const [result, setResult] = useState<TripMateResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pastedSchedule, setPastedSchedule] = useState("");
  const [uploadLabel, setUploadLabel] = useState<string | null>(null);
  const [agentSteps, setAgentSteps] = useState<TripMateAgentStep[]>(() =>
    buildSteps(0, false).map((s) => ({ ...s, state: "pending" as const })),
  );
  const [acceptedIds, setAcceptedIds] = useState<string[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [lastAppliedSummary, setLastAppliedSummary] = useState<string | null>(null);
  const [lastAppliedDayNumber, setLastAppliedDayNumber] = useState<number | null>(null);
  const trajectoryIdRef = useRef<string | null>(null);
  const onApplyRef = useRef(onApplyImproved);
  onApplyRef.current = onApplyImproved;
  const itineraryRef = useRef(itinerary);

  // Sync from props only when parent itinerary changes — do not overwrite
  // mid-apply while local state updates re-render this hook.
  useEffect(() => {
    itineraryRef.current = itinerary;
  }, [itinerary]);

  const hasGeneratedItinerary = Boolean(itinerary?.days.length || plan?.itinerary?.days.length);
  const hasExternalPlan = Boolean(pastedSchedule.trim());

  const runAnalysis = useCallback(
    async (mode: "generated" | "external") => {
      if (!plan || !request) return;

      const destination =
        request.destination?.trim() || plan.featuredDestination.name || "destination";

      const currentItinerary =
        mode === "generated" ? (itinerary ?? plan.itinerary) : undefined;
      const externalText = mode === "external" ? pastedSchedule.trim() : undefined;

      if (mode === "generated" && !currentItinerary?.days.length) return;
      if (mode === "external" && !externalText) return;

      setErrorMessage(null);
      setResult(null);
      setAcceptedIds([]);
      setDismissedIds([]);
      setLastAppliedSummary(null);
      setLastAppliedDayNumber(null);
      setStatus("running");
      setAgentSteps(buildSteps(0, false));

      const trajectory = startTripMateTrajectory(sessionStorage, destination);
      trajectoryIdRef.current = trajectory.id;

      let stepIndex = 0;
      const stepTimer = window.setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, AGENT_STEP_DEFS.length - 1);
        setAgentSteps(buildSteps(stepIndex, false));
      }, 700);

      try {
        appendTripMateStage(sessionStorage, trajectory.id, {
          name: "propose",
          detail: mode === "generated" ? "Analyzing generated itinerary" : "Analyzing external plan",
        });

        const payload = {
          destination,
          interests: request.interests,
          duration: request.duration,
          travelStyle: request.travelStyle,
          itinerary: currentItinerary,
          pastedSchedule: externalText,
          culturalContext: [
            plan.featuredDestination.tagline,
            ...plan.attractions.slice(0, 3).map((a) => a.name),
          ].join(" · "),
          modelPreset: "fast" as const,
        };

        const next = await runTripMate(payload);

        window.clearInterval(stepTimer);
        setStatus("verifying");
        setAgentSteps(buildSteps(AGENT_STEP_DEFS.length - 1, false));
        appendTripMateStage(sessionStorage, trajectory.id, {
          name: "verify",
          detail: next.verificationNotes || "Verifying recommendations…",
        });

        await new Promise((r) => setTimeout(r, 450));

        setAgentSteps(buildSteps(AGENT_STEP_DEFS.length - 1, true));
        setResult(next);
        setStatus("done");
        appendTripMateStage(
          sessionStorage,
          trajectory.id,
          { name: "propose", detail: next.analysisSummary.slice(0, 180) },
          { status: "done", suggestionCount: next.suggestions.length },
        );
      } catch (err) {
        window.clearInterval(stepTimer);
        setErrorMessage(getDisplayError(err));
        setStatus("failed");
        setAgentSteps(buildSteps(0, false).map((s) => ({ ...s, state: "pending" })));
        if (trajectoryIdRef.current) {
          appendTripMateStage(
            sessionStorage,
            trajectoryIdRef.current,
            { name: "failed", detail: getDisplayError(err) },
            { status: "failed" },
          );
        }
      }
    },
    [plan, request, itinerary, pastedSchedule],
  );

  const analyzeGenerated = useCallback(() => runAnalysis("generated"), [runAnalysis]);
  const analyzeExternal = useCallback(() => runAnalysis("external"), [runAnalysis]);

  const applySuggestionById = useCallback(
    (suggestionId: string) => {
      const suggestion = result?.suggestions.find((s) => s.id === suggestionId);
      const current = itineraryRef.current;
      if (!suggestion || !current) return false;

      const patched = applySuggestion(current, suggestion);
      if (!patched) return false;

      // Keep ref current so consecutive Applies stack correctly before React re-renders.
      itineraryRef.current = patched.itinerary;
      onApplyRef.current?.(patched.itinerary);
      setAcceptedIds((ids) => (ids.includes(suggestionId) ? ids : [...ids, suggestionId]));
      setLastAppliedSummary(patched.summary);
      setLastAppliedDayNumber(patched.dayNumber);
      if (typeof document !== "undefined") {
        document.getElementById("explore-days")?.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }
      if (trajectoryIdRef.current) {
        appendTripMateStage(
          sessionStorage,
          trajectoryIdRef.current,
          { name: "apply", detail: patched.summary },
          { status: "applied", applied: true },
        );
      }
      return true;
    },
    [result],
  );

  const dismissSuggestionById = useCallback((suggestionId: string) => {
    setDismissedIds((ids) => (ids.includes(suggestionId) ? ids : [...ids, suggestionId]));
  }, []);

  const applyAllBuffers = useCallback(() => {
    if (!result?.improvedItinerary) return;
    itineraryRef.current = result.improvedItinerary;
    onApplyRef.current?.(result.improvedItinerary);
    setResult({ ...result, applied: true });
    setLastAppliedSummary("Applied full buffer pass to your days");
    setLastAppliedDayNumber(result.improvedItinerary.days[0]?.dayNumber ?? null);
    if (typeof document !== "undefined") {
      document.getElementById("explore-days")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }
    if (trajectoryIdRef.current) {
      appendTripMateStage(
        sessionStorage,
        trajectoryIdRef.current,
        { name: "apply", detail: "Applied full buffer pass" },
        { status: "applied", applied: true },
      );
    }
  }, [result]);

  const handleUpload = useCallback(
    async (file: File | null) => {
      if (!file || !plan) return;
      const destination =
        request?.destination?.trim() || plan.featuredDestination.name || "destination";

      if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
        const text = await file.text();
        setPastedSchedule(text.slice(0, 8000));
        setUploadLabel(file.name);
        return;
      }

      if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name)) {
        const extracted = mockExtractFromUpload(destination, file.name);
        setPastedSchedule(extracted.slice(0, 8000));
        setUploadLabel(`${file.name} (demo extract)`);
        return;
      }

      setUploadLabel(`Unsupported file: ${file.name}`);
    },
    [plan, request],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setErrorMessage(null);
    setAcceptedIds([]);
    setDismissedIds([]);
    setLastAppliedSummary(null);
    setLastAppliedDayNumber(null);
    setAgentSteps(buildSteps(0, false).map((s) => ({ ...s, state: "pending" })));
  }, []);

  useEffect(() => {
    // keep idle steps pending when not running
    if (status === "idle") {
      setAgentSteps(buildSteps(0, false).map((s) => ({ ...s, state: "pending" })));
    }
  }, [status]);

  return {
    status,
    result,
    errorMessage,
    pastedSchedule,
    setPastedSchedule,
    uploadLabel,
    agentSteps,
    acceptedIds,
    dismissedIds,
    lastAppliedSummary,
    lastAppliedDayNumber,
    analyzeGenerated,
    analyzeExternal,
    applySuggestionById,
    dismissSuggestionById,
    applyAllBuffers,
    handleUpload,
    reset,
    hasGeneratedItinerary,
    hasExternalPlan,
    canAnalyzeGenerated: Boolean(plan && request && hasGeneratedItinerary),
    canAnalyzeExternal: Boolean(plan && request && hasExternalPlan),
    isBusy: status === "running" || status === "verifying",
  };
}

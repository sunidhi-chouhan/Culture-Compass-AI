"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type {
  CompassPlanRequest,
  CompassPlanResponse,
  LensMode,
  TripItinerary,
} from "@culturecompass/shared";
import { DEFAULT_LENS_MODE } from "@culturecompass/shared";
import { ConversationalPlanner } from "@/components/planner/conversational-planner";
import { JourneyDashboard } from "@/components/dashboard/journey-dashboard";
import { ParchmentSkeleton } from "@/components/parchment-skeleton";
import { ErrorState } from "@culturecompass/ui";
import { createCompassPlan } from "@/lib/api-client";
import { getDisplayError } from "@/lib/errors";
import { buildCompassPlanRequest, type PlannerAnswers } from "@/lib/planner-constants";
import { readPlannerSession, writePlannerSession } from "@/lib/planner-session-storage";
import { useJourneyItinerary } from "@/hooks/use-journey-itinerary";
import { useTripMate } from "@/hooks/use-tripmate";
import { usePacking } from "@/hooks/use-packing";
import { TripMateImprovePanel } from "@/components/tripmate/tripmate-improve-panel";
import { PackingPreparePanel } from "@/components/packing/packing-prepare-panel";
import { SaveJourneyPanel } from "@/components/library/save-journey-panel";

type SessionPhase = "planner" | "loading" | "results" | "error";

interface PlannerSessionProps {
  initialDestination?: string;
}

const GENERATE_STATUS_LINES = [
  "Gathering your trip context…",
  "Listening for cultural texture…",
  "Opening your Explore workspace…",
];

export function PlannerSession({ initialDestination }: PlannerSessionProps) {
  const searchParams = useSearchParams();
  const resume = searchParams.get("resume") === "1";
  const mode = searchParams.get("mode") === "improve" ? "improve" : "create";

  const [phase, setPhase] = useState<SessionPhase>("planner");
  const [plan, setPlan] = useState<CompassPlanResponse | null>(null);
  const [lastRequest, setLastRequest] = useState<CompassPlanRequest | null>(null);
  const [lensMode, setLensMode] = useState<LensMode>(DEFAULT_LENS_MODE);
  const [lensLoading, setLensLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusIndex, setStatusIndex] = useState(0);

  const persistItinerary = useCallback(
    (nextItinerary: TripItinerary) => {
      setPlan((prev) => {
        if (!prev || !lastRequest) return prev;
        const merged = { ...prev, itinerary: nextItinerary };
        writePlannerSession(sessionStorage, merged, lastRequest);
        return merged;
      });
    },
    [lastRequest],
  );

  const {
    itinerary,
    status: itineraryStatus,
    errorMessage: itineraryError,
    statusLine: itineraryStatusLine,
    isRefreshing: itineraryRefreshing,
    retry: retryItinerary,
    replaceItinerary,
  } = useJourneyItinerary({
    plan,
    request: lastRequest,
    enabled: phase === "results" && Boolean(plan && lastRequest),
    onItineraryReady: persistItinerary,
  });

  const tripMate = useTripMate({
    plan,
    request: lastRequest,
    itinerary,
    onApplyImproved: replaceItinerary,
  });

  const packing = usePacking({
    plan,
    request: lastRequest,
    itinerary,
  });

  useEffect(() => {
    // Only restore a prior journey when explicitly requested (Open / Continue).
    // Start Exploring and Improve my plan must never auto-jump to old results.
    if (!resume) return;
    const restored = readPlannerSession(sessionStorage);
    if (!restored) return;
    setPlan(restored.plan);
    setLastRequest(restored.request);
    setLensMode(restored.lensMode);
    setPhase("results");
  }, [resume]);

  useEffect(() => {
    if (phase !== "loading") return;
    setStatusIndex(0);
    const id = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % GENERATE_STATUS_LINES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, [phase]);

  async function handleGenerate(answers: PlannerAnswers) {
    setPhase("loading");
    setError(null);

    try {
      const payload = buildCompassPlanRequest(answers, lensMode);
      const result = await createCompassPlan(payload);
      setPlan(result);
      setLastRequest(payload);
      writePlannerSession(sessionStorage, result, payload);
      setPhase("results");
    } catch (err) {
      setError(getDisplayError(err));
      setPhase("error");
    }
  }

  async function handleLensModeChange(mode: LensMode) {
    if (mode === lensMode || !lastRequest) return;

    setLensMode(mode);
    setLensLoading(true);
    setError(null);

    try {
      const payload: CompassPlanRequest = { ...lastRequest, lensMode: mode };
      const result = await createCompassPlan(payload);
      // Keep day-wise itinerary if cultural refresh succeeds — Explore stays intact.
      const merged: CompassPlanResponse = itinerary
        ? { ...result, itinerary }
        : plan?.itinerary
          ? { ...result, itinerary: plan.itinerary }
          : result;
      setPlan(merged);
      setLastRequest(payload);
      writePlannerSession(sessionStorage, merged, payload);
    } catch (err) {
      setError(getDisplayError(err));
    } finally {
      setLensLoading(false);
    }
  }

  if (phase === "results" && plan) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        {error && (
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
            <p
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300"
              role="alert"
            >
              {error}
            </p>
          </div>
        )}
        <JourneyDashboard
          plan={plan}
          lensMode={lensMode}
          lensLoading={lensLoading}
          onLensModeChange={handleLensModeChange}
          itinerary={itinerary}
          itineraryStatus={itineraryStatus}
          itineraryError={itineraryError}
          itineraryStatusLine={itineraryStatusLine}
          itineraryRefreshing={itineraryRefreshing}
          onRetryItinerary={retryItinerary}
          focusDayNumber={tripMate.lastAppliedDayNumber}
          improvePanel={
            <TripMateImprovePanel
              status={tripMate.status}
              result={tripMate.result}
              errorMessage={tripMate.errorMessage}
              agentSteps={tripMate.agentSteps}
              pastedSchedule={tripMate.pastedSchedule}
              uploadLabel={tripMate.uploadLabel}
              acceptedIds={tripMate.acceptedIds}
              dismissedIds={tripMate.dismissedIds}
              lastAppliedSummary={tripMate.lastAppliedSummary}
              onPastedScheduleChange={tripMate.setPastedSchedule}
              onUpload={tripMate.handleUpload}
              onAnalyzeGenerated={tripMate.analyzeGenerated}
              onAnalyzeExternal={tripMate.analyzeExternal}
              onApplySuggestion={tripMate.applySuggestionById}
              onDismissSuggestion={tripMate.dismissSuggestionById}
              onApplyAllBuffers={tripMate.applyAllBuffers}
              onReset={tripMate.reset}
              canAnalyzeGenerated={tripMate.canAnalyzeGenerated}
              canAnalyzeExternal={tripMate.canAnalyzeExternal}
              hasGeneratedItinerary={tripMate.hasGeneratedItinerary}
              isBusy={tripMate.isBusy}
            />
          }
          libraryPanel={
            lastRequest ? (
              <SaveJourneyPanel
                plan={plan}
                request={lastRequest}
                itinerary={itinerary}
                tripMate={tripMate.result}
                packing={packing.packing}
              />
            ) : null
          }
          packingPanel={
            <PackingPreparePanel
              packing={packing.packing}
              status={packing.status}
              errorMessage={packing.errorMessage}
              statusLine={packing.statusLine}
              climateNotes={packing.climateNotes}
              activityNotes={packing.activityNotes}
              extraDraft={packing.extraDraft}
              packedCount={packing.packedCount}
              totalCount={packing.totalCount}
              essentialRemaining={packing.essentialRemaining}
              tripSummary={packing.tripSummary}
              destination={packing.destination}
              journeyStale={packing.journeyStale}
              canGenerate={packing.canGenerate}
              isBusy={packing.isBusy}
              onClimateNotesChange={packing.setClimateNotes}
              onActivityNotesChange={packing.setActivityNotes}
              onExtraDraftChange={packing.setExtraDraft}
              onGenerate={() => void packing.generate()}
              onTogglePacked={packing.togglePacked}
              onAddExtra={packing.addExtra}
              onReset={packing.reset}
            />
          }
        />
      </motion.div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center px-4">
        <p className="theme-badge mb-4 text-[10px] tracking-[0.18em]">Generate</p>
        <motion.p
          key={statusIndex}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="theme-text mb-2 text-center font-serif text-xl font-semibold tracking-tight sm:text-2xl"
          aria-live="polite"
        >
          {GENERATE_STATUS_LINES[statusIndex]}
        </motion.p>
        <p className="theme-text-muted mb-8 max-w-sm text-center text-sm">
          JourneyMind is preparing Explore — your days come first, culture right after.
        </p>
        <div className="w-full max-w-lg">
          <ParchmentSkeleton />
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex min-h-[calc(100dvh-4.5rem)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-4">
          <ErrorState
            message={error ?? "Something went wrong."}
            onRetry={() => setPhase("planner")}
          />
          <p className="text-center">
            <Link href="/" className="theme-text text-sm underline-offset-4 hover:underline">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="planner"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <ConversationalPlanner
          initialDestination={initialDestination}
          entryMode={mode}
          onGenerate={handleGenerate}
        />
      </motion.div>
    </AnimatePresence>
  );
}

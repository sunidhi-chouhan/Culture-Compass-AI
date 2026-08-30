"use client";

import {
  Check,
  Circle,
  CircleAlert,
  Loader2,
  Upload,
  Wand2,
} from "lucide-react";
import type { TripMateResult, TripMateSuggestion } from "@culturecompass/shared";
import type { TripMateAgentStatus, TripMateAgentStep } from "@/hooks/use-tripmate";

interface TripMateImprovePanelProps {
  status: TripMateAgentStatus;
  result: TripMateResult | null;
  errorMessage?: string | null;
  agentSteps: TripMateAgentStep[];
  pastedSchedule: string;
  uploadLabel?: string | null;
  acceptedIds: string[];
  dismissedIds: string[];
  lastAppliedSummary?: string | null;
  onPastedScheduleChange: (value: string) => void;
  onUpload: (file: File | null) => void;
  onAnalyzeGenerated: () => void;
  onAnalyzeExternal: () => void;
  onApplySuggestion: (id: string) => void;
  onDismissSuggestion: (id: string) => void;
  onApplyAllBuffers: () => void;
  onReset: () => void;
  canAnalyzeGenerated: boolean;
  canAnalyzeExternal: boolean;
  hasGeneratedItinerary: boolean;
  isBusy: boolean;
}

export function TripMateImprovePanel({
  status,
  result,
  errorMessage,
  agentSteps,
  pastedSchedule,
  uploadLabel,
  acceptedIds,
  dismissedIds,
  lastAppliedSummary = null,
  onPastedScheduleChange,
  onUpload,
  onAnalyzeGenerated,
  onAnalyzeExternal,
  onApplySuggestion,
  onDismissSuggestion,
  onApplyAllBuffers,
  onReset,
  canAnalyzeGenerated,
  canAnalyzeExternal,
  hasGeneratedItinerary,
  isBusy,
}: TripMateImprovePanelProps) {
  const openFindings =
    result?.suggestions.filter(
      (s) => !acceptedIds.includes(s.id) && !dismissedIds.includes(s.id),
    ) ?? [];

  return (
    <section
      id="improve-tripmate"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6"
      aria-label="TripMate"
    >
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="theme-badge text-[10px] tracking-[0.18em]">Improve · TripMate</p>
          <h2 className="theme-text mt-2 font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            TripMate
          </h2>
          <p className="theme-text-muted mt-1 max-w-xl text-sm">
            Your AI travel planner — check, improve, and optimize your schedule.
          </p>
        </div>
        <AgentStatusBadge status={status} />
      </div>

      <div className="space-y-4">
        {status === "idle" || status === "failed" ? (
          <>
            <div className="glass-card space-y-4 rounded-2xl border p-4 sm:p-6">
              <div>
                <p className="theme-text text-sm font-semibold">
                  {hasGeneratedItinerary
                    ? "Your itinerary is ready"
                    : "No generated itinerary yet"}
                </p>
                <p className="theme-text-muted mt-1 text-sm">TripMate can check:</p>
                <ul className="theme-text-muted mt-2 list-inside list-disc space-y-1 text-sm">
                  <li>Schedule conflicts</li>
                  <li>Travel gaps</li>
                  <li>Overloaded days</li>
                  <li>Better activity ordering</li>
                  <li>Missing experiences</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={onAnalyzeGenerated}
                disabled={!canAnalyzeGenerated || isBusy}
                className="cta-glow inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                <Wand2 className="h-4 w-4" aria-hidden="true" />
                Analyze my itinerary
              </button>
            </div>

            <div className="glass-card space-y-4 rounded-2xl border p-4 sm:p-6">
              <div>
                <p className="theme-text text-sm font-semibold">Already have a schedule?</p>
                <p className="theme-text-muted mt-1 text-sm">
                  Upload a ticket/screenshot note or paste your plan — TripMate will reason over it.
                </p>
              </div>

              <label className="theme-chip inline-flex cursor-pointer items-center gap-2 text-sm">
                <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                Upload schedule / ticket / image
                <input
                  type="file"
                  accept="image/*,.txt,.md,.csv,text/plain"
                  className="sr-only"
                  disabled={isBusy}
                  onChange={(e) => {
                    onUpload(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </label>
              {uploadLabel ? (
                <p className="theme-text-subtle text-xs">{uploadLabel}</p>
              ) : null}

              <label className="block space-y-2">
                <span className="theme-text-subtle text-xs font-medium uppercase tracking-[0.1em]">
                  Or paste schedule
                </span>
                <textarea
                  value={pastedSchedule}
                  onChange={(e) => onPastedScheduleChange(e.target.value)}
                  rows={3}
                  disabled={isBusy}
                  placeholder="e.g. Day 2: 10:00 Heritage site, 12:00 Museum, 14:00 Market…"
                  className="theme-input w-full resize-y text-sm"
                  aria-label="Paste existing schedule"
                />
              </label>

              <button
                type="button"
                onClick={onAnalyzeExternal}
                disabled={!canAnalyzeExternal || isBusy}
                className="theme-chip theme-chip-active inline-flex items-center gap-2 text-sm disabled:opacity-40"
              >
                Analyze pasted / uploaded plan
              </button>
            </div>

            {status === "failed" && errorMessage ? (
              <div
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm"
                role="alert"
              >
                <p className="theme-text font-medium">TripMate couldn’t finish</p>
                <p className="theme-text-muted mt-1">{errorMessage}</p>
                <p className="theme-text-subtle mt-2 text-xs">
                  Your itinerary above is unchanged — retry whenever you’re ready.
                </p>
              </div>
            ) : null}

            <p className="theme-text-subtle flex items-start gap-2 text-sm">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              Runs only when you ask. Failure never removes your days or cultural journey.
            </p>
          </>
        ) : null}

        {isBusy ? (
          <div className="glass-card space-y-4 rounded-2xl border p-4 sm:p-6">
            <p className="theme-text text-sm font-semibold" aria-live="polite">
              TripMate is analyzing your journey…
            </p>
            <AgentProgress steps={agentSteps} />
          </div>
        ) : null}

        {status === "done" && result ? (
          <div className="glass-card space-y-5 rounded-2xl border p-4 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="theme-text text-sm font-semibold">TripMate Analysis</p>
                <p className="theme-text-muted mt-1 text-sm leading-relaxed">
                  {result.analysisSummary}
                </p>
                <p className="theme-text mt-2 text-sm font-medium">
                  {openFindings.length} improvement
                  {openFindings.length === 1 ? "" : "s"} open
                  {acceptedIds.length > 0 ? ` · ${acceptedIds.length} applied` : ""}
                  {dismissedIds.length > 0 ? ` · ${dismissedIds.length} kept` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={onReset}
                className="theme-text-subtle text-sm hover:text-[var(--foreground)]"
              >
                Analyze again
              </button>
            </div>

            {result.verificationNotes ? (
              <p className="theme-text-subtle text-xs leading-relaxed">
                Verified: {result.verificationNotes}
              </p>
            ) : null}

            {lastAppliedSummary ? (
              <div
                className="rounded-xl border border-[var(--border)] bg-[var(--accent-muted)] px-4 py-3 text-sm"
                role="status"
                aria-live="polite"
              >
                <p className="theme-text font-medium">Applied to your itinerary</p>
                <p className="theme-text-muted mt-1">{lastAppliedSummary}</p>
                <a
                  href="#explore-days"
                  className="theme-text mt-2 inline-block text-xs font-medium underline-offset-2 hover:underline"
                >
                  View updated days ↑
                </a>
              </div>
            ) : null}

            <ul className="space-y-3" aria-label="TripMate findings">
              {result.suggestions.map((suggestion) => (
                <FindingCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  state={
                    acceptedIds.includes(suggestion.id)
                      ? "applied"
                      : dismissedIds.includes(suggestion.id)
                        ? "dismissed"
                        : "open"
                  }
                  onApply={() => onApplySuggestion(suggestion.id)}
                  onDismiss={() => onDismissSuggestion(suggestion.id)}
                />
              ))}
            </ul>

            {result.improvedItinerary && !result.applied ? (
              <button
                type="button"
                onClick={onApplyAllBuffers}
                className="theme-text-subtle text-xs underline-offset-2 hover:underline"
              >
                Optional: apply full buffer pass
              </button>
            ) : null}
            {result.applied ? (
              <p className="theme-text-subtle text-xs">Full buffer pass applied to your days.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AgentProgress({ steps }: { steps: TripMateAgentStep[] }) {
  return (
    <ol className="space-y-2.5" aria-label="TripMate agent progress">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center gap-2.5 text-sm">
          {step.state === "done" ? (
            <Check className="h-4 w-4 shrink-0 text-[var(--foreground)]" aria-hidden="true" />
          ) : step.state === "active" ? (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin opacity-80"
              aria-hidden="true"
            />
          ) : (
            <Circle className="theme-text-subtle h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span
            className={
              step.state === "pending" ? "theme-text-subtle" : "theme-text font-medium"
            }
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}

function FindingCard({
  suggestion,
  state,
  onApply,
  onDismiss,
}: {
  suggestion: TripMateSuggestion;
  state: "open" | "applied" | "dismissed";
  onApply: () => void;
  onDismiss: () => void;
}) {
  const canApply = Boolean(suggestion.action) && state === "open";

  return (
    <li
      className={`rounded-xl border px-4 py-3 ${
        state === "dismissed" ? "opacity-50" : ""
      }`}
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        {suggestion.dayLabel ? (
          <span className="theme-badge text-[10px] tracking-[0.1em]">{suggestion.dayLabel}</span>
        ) : null}
        <span className="theme-badge text-[10px] tracking-[0.1em]">{suggestion.kind}</span>
        <span className="theme-text-subtle text-[11px]">{suggestion.severity}</span>
        {state === "applied" ? (
          <span className="theme-text-subtle text-[11px]">Applied</span>
        ) : null}
        {state === "dismissed" ? (
          <span className="theme-text-subtle text-[11px]">Kept current</span>
        ) : null}
      </div>
      <p className="theme-text mt-1.5 text-sm font-medium">{suggestion.title}</p>
      {suggestion.headline ? (
        <p className="theme-text-muted mt-0.5 text-sm">{suggestion.headline}</p>
      ) : null}
      <p className="theme-text-muted mt-1 text-sm leading-relaxed">{suggestion.detail}</p>
      {suggestion.recommendation ? (
        <p className="theme-text mt-2 text-sm">
          <span className="font-medium">Recommended: </span>
          {suggestion.recommendation}
        </p>
      ) : null}

      {state === "open" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {canApply ? (
            <button
              type="button"
              onClick={onApply}
              className="theme-chip theme-chip-active text-xs"
            >
              Apply
            </button>
          ) : null}
          <button type="button" onClick={onDismiss} className="theme-chip text-xs">
            Keep current plan
          </button>
        </div>
      ) : null}
    </li>
  );
}

function AgentStatusBadge({ status }: { status: TripMateAgentStatus }) {
  const label: Record<TripMateAgentStatus, string> = {
    idle: "Idle",
    running: "Analyzing",
    verifying: "Verifying",
    done: "Done",
    failed: "Failed",
  };
  return (
    <p className="theme-text-subtle text-xs tabular-nums" aria-live="polite">
      Agent · {label[status]}
    </p>
  );
}

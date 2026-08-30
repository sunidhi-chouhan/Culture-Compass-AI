"use client";

import { motion } from "framer-motion";
import { BookOpen, Pause, Play, ScrollText } from "lucide-react";
import type { CompassPlanResponse } from "@culturecompass/shared";
import { useStorySpeech } from "@/hooks/use-story-speech";
import { buildJourneyNarration } from "@/lib/story-speech";

interface StoryModeCardProps {
  plan: CompassPlanResponse;
  destinationName: string;
}

export function StoryModeCard({ plan, destinationName }: StoryModeCardProps) {
  const narrative = buildJourneyNarration(plan);
  const {
    tokens,
    status,
    activeWordIndex,
    readThroughIndex,
    supported,
    errorMessage,
    play,
    pause,
    resume,
  } = useStorySpeech(narrative);
  const isPlaying = status === "playing";
  const isPaused = status === "paused";
  const playLabel = isPaused ? "Resume Story" : "Play Story";

  function handlePlay() {
    if (isPaused) {
      resume();
    } else {
      play();
    }
  }

  return (
    <section aria-label="Story Mode" className="story-mode-section">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: "var(--accent-muted)" }}
          >
            <ScrollText className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          </div>
          <div>
            <p className="theme-badge mb-1 text-[10px]">Immersive</p>
            <h2 className="theme-text font-serif text-xl font-semibold tracking-tight sm:text-2xl">
              Story Mode
            </h2>
            <p className="theme-text-muted mt-1 text-sm">
              An AI-crafted narrative journey through {destinationName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Story playback controls">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!supported || isPlaying}
            className={`story-mode-control inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              isPaused ? "ring-1 ring-[var(--border)]" : ""
            }`}
            aria-label={playLabel}
            aria-pressed={isPlaying}
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            {playLabel}
          </button>
          <button
            type="button"
            onClick={pause}
            disabled={!supported || !isPlaying}
            className={`story-mode-control-secondary inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold disabled:opacity-50 ${
              isPlaying ? "border-[var(--foreground)] text-[var(--foreground)]" : ""
            }`}
            aria-label="Pause story"
            aria-pressed={isPaused}
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Pause Story
          </button>
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          {isPlaying
            ? "Story is playing."
            : isPaused
              ? "Story is paused."
              : "Story is ready to play."}
        </p>
      </div>

      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`parchment-card relative overflow-hidden rounded-3xl p-6 sm:p-8 ${isPlaying ? "parchment-card--reading" : ""}`}
      >
        <div className="parchment-card__texture pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="parchment-card__edge pointer-events-none absolute inset-x-0 top-0 h-1" aria-hidden="true" />

        <header className="relative mb-5 flex items-center gap-2 border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] pb-4">
          <BookOpen className="h-4 w-4 opacity-60" strokeWidth={1.75} aria-hidden="true" />
          <h3 className="font-serif text-lg font-semibold tracking-tight text-[var(--parchment-ink)] sm:text-xl">
            {plan.storySnippet.title}
          </h3>
        </header>

        <p
          className="relative font-serif text-base leading-[1.9] text-[var(--parchment-ink)] sm:text-lg sm:leading-[2]"
          aria-live="polite"
          aria-atomic="false"
        >
          {tokens.map((token, index) => {
            const isActive = index === activeWordIndex;
            const isRead = index <= readThroughIndex;
            return (
              <span
                key={`${token.start}-${token.word}`}
                className={[
                  "story-word inline transition-all duration-200",
                  isActive ? "story-word--active" : "",
                  isRead && !isActive ? "story-word--read" : "",
                  !isRead && !isActive && status !== "idle" ? "story-word--pending" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {token.word}{" "}
              </span>
            );
          })}
        </p>

        <footer className="relative mt-6 flex flex-col gap-2 text-xs text-[color-mix(in_srgb,var(--parchment-ink)_65%,transparent)] sm:flex-row sm:items-center sm:justify-between">
          <span className="capitalize">{plan.storySnippet.tone} narrative</span>
          {!supported && (
            <span className="text-amber-700 dark:text-amber-300">
              Speech playback not supported in this browser — you can still read the story.
            </span>
          )}
          {errorMessage && (
            <span className="text-amber-700 dark:text-amber-300" role="status">
              {errorMessage}
            </span>
          )}
        </footer>
      </motion.article>
    </section>
  );
}

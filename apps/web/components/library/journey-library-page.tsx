"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  MapPin,
  Trash2,
} from "lucide-react";
import type { SavedJourney } from "@culturecompass/shared";
import { useJourneyLibrary } from "@/hooks/use-journey-library";
import { openSavedJourneyIntoSession } from "@/lib/open-saved-journey";

function formatUpdatedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function JourneyLibraryPage() {
  const router = useRouter();
  const { journeys, hydrated, isEmpty, removeJourney, clearAll, activeJourneyId } =
    useJourneyLibrary();
  const [confirmClear, setConfirmClear] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function openJourney(journey: SavedJourney) {
    openSavedJourneyIntoSession(journey, sessionStorage);
    router.push("/plan?resume=1");
  }

  function continueLatest() {
    const latest = journeys[0];
    if (!latest) return;
    openJourney(latest);
  }

  function handleDelete(id: string) {
    removeJourney(id);
    setPendingDeleteId(null);
  }

  function handleClearAll() {
    clearAll();
    setConfirmClear(false);
  }

  return (
    <div className="mx-auto min-h-[calc(100dvh-4.5rem)] max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="theme-badge text-[10px] tracking-[0.18em]">Library</p>
          <h1 className="theme-text mt-2 font-serif text-3xl font-semibold tracking-tight">
            My journeys
          </h1>
          <p className="theme-text-muted mt-2 max-w-md text-sm leading-relaxed">
            Saved trips on this device. Open one to continue Explore → Improve → Prepare, or clear
            the library when you&apos;re done.
          </p>
        </div>
        <Link
          href="/"
          className="theme-text-subtle text-sm underline-offset-2 hover:underline"
        >
          Back to Discover
        </Link>
      </div>

      {!hydrated ? (
        <p className="theme-text-muted text-sm">Loading your library…</p>
      ) : isEmpty ? (
        <EmptyLibrary />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={continueLatest}
              className="cta-glow inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Continue latest
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="theme-text-subtle text-sm hover:text-[var(--foreground)]"
              >
                Clear all
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="Confirm clear all">
                <span className="theme-text-muted">Delete every saved journey?</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="rounded-full border border-red-500/40 px-3 py-1.5 text-red-600 dark:text-red-300"
                >
                  Yes, clear all
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="theme-text-subtle px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <ul className="space-y-3" aria-label="Saved journeys">
            {journeys.map((journey, index) => (
              <motion.li
                key={journey.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.24), duration: 0.3 }}
                className="glass-card rounded-2xl border p-4 sm:p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="theme-text font-serif text-xl font-semibold tracking-tight">
                        {journey.title}
                      </h2>
                      {activeJourneyId === journey.id ? (
                        <span className="theme-badge rounded-full px-2 py-0.5 text-[10px]">
                          Active
                        </span>
                      ) : null}
                    </div>
                    <p className="theme-text-muted mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        {journey.preferences.destination ||
                          journey.culturalPlan.featuredDestination.name}
                      </span>
                      {journey.preferences.duration ? (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                          {journey.preferences.duration}
                        </span>
                      ) : null}
                      {journey.itinerary?.days.length ? (
                        <span>
                          {journey.itinerary.days.length} day
                          {journey.itinerary.days.length === 1 ? "" : "s"} planned
                        </span>
                      ) : null}
                    </p>
                    <p className="theme-text-subtle mt-2 text-xs">
                      Updated {formatUpdatedAt(journey.updatedAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openJourney(journey)}
                      className="theme-text inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold hover:border-[var(--foreground)]"
                    >
                      <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                      Open
                    </button>
                    {pendingDeleteId === journey.id ? (
                      <div className="flex items-center gap-2 text-sm">
                        <button
                          type="button"
                          onClick={() => handleDelete(journey.id)}
                          className="rounded-full border border-red-500/40 px-3 py-1.5 text-red-600 dark:text-red-300"
                        >
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(null)}
                          className="theme-text-subtle px-2 py-1.5"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(journey.id)}
                        className="theme-text-subtle inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm hover:text-red-600 dark:hover:text-red-300"
                        aria-label={`Delete ${journey.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="glass-card rounded-2xl border px-6 py-12 text-center">
      <LibraryIcon />
      <h2 className="theme-text mt-4 font-serif text-xl font-semibold">No saved journeys yet</h2>
      <p className="theme-text-muted mx-auto mt-2 max-w-sm text-sm leading-relaxed">
        Build a trip, explore your days, then tap Save journey on Explore to keep it here.
      </p>
      <Link
        href="/"
        className="cta-glow mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
      >
        Start Exploring
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}

function LibraryIcon() {
  return (
    <div
      className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)]"
      aria-hidden="true"
    >
      <BookOpen className="theme-text-muted h-5 w-5" />
    </div>
  );
}

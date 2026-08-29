"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkPlus, Check, Library } from "lucide-react";
import type {
  CompassPlanRequest,
  CompassPlanResponse,
  PackingList,
  SavedJourney,
  TripItinerary,
  TripMateResult,
} from "@culturecompass/shared";
import { buildSavedJourney, defaultJourneyTitle } from "@/lib/build-saved-journey";
import {
  getSavedJourney,
  readActiveJourneySession,
  upsertSavedJourney,
  writeActiveJourneySession,
} from "@/lib/journey-library-storage";

interface SaveJourneyPanelProps {
  plan: CompassPlanResponse;
  request: CompassPlanRequest;
  itinerary?: TripItinerary | null;
  tripMate?: TripMateResult | null;
  packing?: PackingList | null;
  onSaved?: (journey: SavedJourney) => void;
}

export function SaveJourneyPanel({
  plan,
  request,
  itinerary = null,
  tripMate = null,
  packing = null,
  onSaved,
}: SaveJourneyPanelProps) {
  const destination =
    request.destination?.trim() || plan.featuredDestination.name || "Journey";
  const [title, setTitle] = useState(() =>
    defaultJourneyTitle(destination, request.duration),
  );
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function handleSave() {
    try {
      const existingId = readActiveJourneySession(sessionStorage).activeJourneyId;
      const existing = existingId
        ? getSavedJourney(localStorage, existingId)
        : null;

      const journey = buildSavedJourney({
        plan,
        request,
        itinerary,
        tripMate,
        packing,
        existing,
        title,
      });

      const saved = upsertSavedJourney(localStorage, journey);
      writeActiveJourneySession(sessionStorage, {
        activeJourneyId: saved.id,
        isDraft: false,
        updatedAt: saved.updatedAt,
      });

      setStatus("saved");
      setMessage(existing ? "Journey updated in My journeys" : "Saved to My journeys");
      onSaved?.(saved);
    } catch {
      setStatus("error");
      setMessage("Couldn’t save this journey. Try again.");
    }
  }

  return (
    <section
      id="save-journey"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6"
      aria-label="Save journey"
    >
      <div className="mb-4">
        <p className="theme-badge text-[10px] tracking-[0.18em]">Library</p>
        <h2 className="theme-text mt-2 font-serif text-2xl font-semibold tracking-tight">
          Save this journey
        </h2>
        <p className="theme-text-muted mt-1 max-w-xl text-sm">
          Keep days, culture, and TripMate notes on this device — open them anytime from My
          journeys.
        </p>
      </div>

      <div className="glass-card rounded-2xl border p-4 sm:p-5">
        <label htmlFor="journey-title" className="theme-text-subtle text-xs font-medium">
          Title
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="journey-title"
            type="text"
            value={title}
            maxLength={200}
            onChange={(e) => {
              setTitle(e.target.value);
              setStatus("idle");
              setMessage(null);
            }}
            className="theme-text w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
          />
          <button
            type="button"
            onClick={handleSave}
            className="cta-glow inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
          >
            {status === "saved" ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <BookmarkPlus className="h-4 w-4" aria-hidden="true" />
            )}
            {status === "saved" ? "Saved" : "Save journey"}
          </button>
        </div>

        {message ? (
          <p
            className={`mt-3 text-sm ${status === "error" ? "text-red-600 dark:text-red-300" : "theme-text-muted"}`}
            role="status"
          >
            {message}
            {status === "saved" ? (
              <>
                {" · "}
                <Link
                  href="/journeys"
                  className="theme-text inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline"
                >
                  <Library className="h-3.5 w-3.5" aria-hidden="true" />
                  My journeys
                </Link>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </section>
  );
}

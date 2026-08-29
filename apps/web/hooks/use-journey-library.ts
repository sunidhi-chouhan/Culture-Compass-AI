"use client";

import { useCallback, useEffect, useState } from "react";
import type { SavedJourney } from "@culturecompass/shared";
import {
  clearAllSavedJourneys,
  deleteSavedJourney,
  getSavedJourney,
  listSavedJourneys,
  readActiveJourneySession,
  upsertSavedJourney,
  writeActiveJourneySession,
} from "@/lib/journey-library-storage";

function libraryStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function sessionPointerStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage;
}

export function useJourneyLibrary() {
  const [journeys, setJourneys] = useState<SavedJourney[]>([]);
  const [activeJourneyId, setActiveJourneyId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(() => {
    const lib = libraryStorage();
    const sess = sessionPointerStorage();
    if (!lib) return;
    setJourneys(listSavedJourneys(lib));
    if (sess) {
      setActiveJourneyId(readActiveJourneySession(sess).activeJourneyId);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveJourney = useCallback(
    (journey: SavedJourney) => {
      const lib = libraryStorage();
      const sess = sessionPointerStorage();
      if (!lib) return null;
      const saved = upsertSavedJourney(lib, journey);
      if (sess) {
        writeActiveJourneySession(sess, {
          activeJourneyId: saved.id,
          isDraft: false,
          updatedAt: saved.updatedAt,
        });
      }
      refresh();
      return saved;
    },
    [refresh],
  );

  const removeJourney = useCallback(
    (id: string) => {
      const lib = libraryStorage();
      const sess = sessionPointerStorage();
      if (!lib) return false;
      const ok = deleteSavedJourney(lib, id);
      if (ok && sess) {
        const active = readActiveJourneySession(sess);
        if (active.activeJourneyId === id) {
          writeActiveJourneySession(sess, {
            activeJourneyId: null,
            isDraft: true,
            updatedAt: new Date().toISOString(),
          });
        }
      }
      refresh();
      return ok;
    },
    [refresh],
  );

  const clearAll = useCallback(() => {
    const lib = libraryStorage();
    const sess = sessionPointerStorage();
    if (!lib) return;
    clearAllSavedJourneys(lib);
    if (sess) {
      writeActiveJourneySession(sess, {
        activeJourneyId: null,
        isDraft: true,
        updatedAt: new Date().toISOString(),
      });
    }
    refresh();
  }, [refresh]);

  const findById = useCallback((id: string) => {
    const lib = libraryStorage();
    if (!lib) return null;
    return getSavedJourney(lib, id);
  }, []);

  return {
    journeys,
    activeJourneyId,
    hydrated,
    refresh,
    saveJourney,
    removeJourney,
    clearAll,
    findById,
    isEmpty: hydrated && journeys.length === 0,
    count: journeys.length,
  };
}

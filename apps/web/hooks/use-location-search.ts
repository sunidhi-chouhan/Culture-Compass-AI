"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Location } from "@culturecompass/shared";
import { fetchLocationSearch } from "@/lib/locations/search-api";

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export interface UseLocationSearchOptions {
  debounceMs?: number;
  limit?: number;
}

export interface UseLocationSearchResult {
  inputValue: string;
  setInputValue: (value: string) => void;
  setInputValueSilent: (value: string) => void;
  results: Location[];
  loading: boolean;
  error: string | null;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  selectLocation: (location: Location) => void;
  clearSelection: () => void;
  search: (query: string) => void;
}

export function useLocationSearch(
  options: UseLocationSearchOptions = {},
): UseLocationSearchResult {
  const debounceMs = options.debounceMs ?? DEBOUNCE_MS;
  const limit = options.limit ?? 8;

  const [inputValue, setInputValueState] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (query: string) => {
      const trimmed = query.trim();

      if (trimmed.length < MIN_QUERY_LENGTH) {
        abortRef.current?.abort();
        setResults([]);
        setLoading(false);
        setError(null);
        setActiveIndex(-1);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const nextResults = await fetchLocationSearch(trimmed, {
          limit,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setResults(nextResults);
        setActiveIndex(nextResults.length > 0 ? 0 : -1);
        setIsOpen(true);
      } catch (err) {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(err instanceof Error ? err.message : "Unable to search locations.");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    },
    [limit],
  );

  const search = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        void runSearch(query);
      }, debounceMs);
    },
    [debounceMs, runSearch],
  );

  const setInputValueSilent = useCallback((value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    abortRef.current?.abort();
    setInputValueState(value);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError(null);
    setLoading(false);
  }, []);

  const setInputValue = useCallback(
    (value: string) => {
      setInputValueState(value);
      search(value);
    },
    [search],
  );

  const selectLocation = useCallback((location: Location) => {
    setInputValueState(location.displayLabel);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError(null);
    abortRef.current?.abort();
  }, []);

  const clearSelection = useCallback(() => {
    setInputValueState("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setError(null);
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  return {
    inputValue,
    setInputValue,
    setInputValueSilent,
    results,
    loading,
    error,
    isOpen,
    setIsOpen,
    activeIndex,
    setActiveIndex,
    selectLocation,
    clearSelection,
    search,
  };
}

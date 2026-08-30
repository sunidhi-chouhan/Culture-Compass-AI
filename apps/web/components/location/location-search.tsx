"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, MapPin, Search, X } from "lucide-react";
import type { Location } from "@culturecompass/shared";
import { useLocationSearch } from "@/hooks/use-location-search";
import { computeDropdownPlacement, type DropdownPlacement } from "@/lib/dropdown-placement";

export interface LocationSearchProps {
  id?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  initialText?: string;
  initialLocation?: Location | null;
  /** External selection (e.g. Try chips) — syncs without opening suggestions. */
  selection?: Location | null;
  onLocationChange?: (location: Location | null) => void;
  onInputTextChange?: (text: string) => void;
  onEnterPress?: () => void;
  variant?: "hero" | "planner" | "default";
}

export function LocationSearch({
  id,
  placeholder = "Where does your curiosity lead?",
  className = "",
  inputClassName = "",
  initialText = "",
  initialLocation = null,
  selection = null,
  onLocationChange,
  onInputTextChange,
  onEnterPress,
  variant = "default",
}: LocationSearchProps) {
  const listboxId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [dropdownPlacement, setDropdownPlacement] = useState<DropdownPlacement>("below");

  const {
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
  } = useLocationSearch();

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setInputValueSilent(initialLocation.displayLabel);
      setIsEditing(false);
      onInputTextChange?.(initialLocation.displayLabel);
    } else if (initialText) {
      setInputValueSilent(initialText);
      setIsEditing(false);
      onInputTextChange?.(initialText);
    }
    // Apply initial values once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selection) return;
    if (selectedLocation?.id === selection.id && inputValue === selection.displayLabel) {
      return;
    }

    setSelectedLocation(selection);
    setInputValueSilent(selection.displayLabel);
    setIsEditing(false);
    onInputTextChange?.(selection.displayLabel);
    onLocationChange?.(selection);
  }, [selection, selectedLocation?.id, inputValue, onInputTextChange, onLocationChange, setInputValueSilent]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen]);

  function handleInputChange(next: string) {
    setIsEditing(true);
    setInputValue(next);
    onInputTextChange?.(next);

    if (selectedLocation && next !== selectedLocation.displayLabel) {
      setSelectedLocation(null);
      onLocationChange?.(null);
    }
  }

  function handleSelect(location: Location) {
    selectLocation(location);
    setSelectedLocation(location);
    setIsEditing(false);
    onLocationChange?.(location);
  }

  function handleClear() {
    clearSelection();
    setSelectedLocation(null);
    setIsEditing(false);
    onLocationChange?.(null);
    onInputTextChange?.("");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isEditing && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsEditing(true);
    }

    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      if (inputValue.trim().length >= 2) {
        setIsOpen(true);
        void search(inputValue);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = activeIndex < results.length - 1 ? activeIndex + 1 : 0;
      setActiveIndex(next);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = activeIndex > 0 ? activeIndex - 1 : results.length - 1;
      setActiveIndex(next);
    } else if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (event.key === "Enter") {
      onEnterPress?.();
    } else if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const shellClass =
    variant === "hero"
      ? "glass-search group relative flex items-center gap-3 rounded-2xl px-4 py-2 sm:rounded-full sm:px-6 sm:py-3"
      : variant === "planner"
        ? "glass-search group relative flex items-center gap-2 rounded-2xl px-4 py-1"
        : "relative flex items-center gap-3 rounded-xl border px-4 py-2";

  const shellStyle =
    variant === "hero" || variant === "planner"
      ? undefined
      : { borderColor: "var(--border)", background: "var(--surface)" };

  const showDropdown =
    isEditing &&
    isOpen &&
    (loading || error || results.length > 0 || inputValue.trim().length >= 2);

  const showClearButton = inputValue.trim().length > 0;

  useEffect(() => {
    if (!showDropdown || !wrapperRef.current) {
      return;
    }

    function updatePlacement() {
      if (!wrapperRef.current) return;
      // Planner search sits in the bottom dock — prefer opening upward over the chat.
      if (variant === "planner") {
        setDropdownPlacement("above");
        return;
      }
      setDropdownPlacement(computeDropdownPlacement(wrapperRef.current.getBoundingClientRect()));
    }

    updatePlacement();

    const observer = new ResizeObserver(updatePlacement);
    observer.observe(wrapperRef.current);
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [showDropdown, results.length, loading, error, variant]);

  const dropdownPositionClass =
    dropdownPlacement === "below" ? "top-full mt-2" : "bottom-full mb-2";

  const dropdownMotionOffset = dropdownPlacement === "below" ? -4 : 4;

  return (
    <div ref={wrapperRef} className={`relative isolate z-40 ${className}`}>
      <label htmlFor={id ?? "location-search"} className="sr-only">
        Search destination
      </label>
      <div className={shellClass} style={shellStyle}>
        <Search
          className={`shrink-0 opacity-40 transition-opacity group-focus-within:opacity-70 ${
            variant === "planner" ? "h-4 w-4" : "h-5 w-5"
          }`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <input
          id={id ?? "location-search"}
          type="text"
          role="combobox"
          aria-expanded={Boolean(showDropdown)}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            if (
              selectedLocation &&
              !isEditing &&
              inputValue === selectedLocation.displayLabel
            ) {
              return;
            }
            if (isEditing && inputValue.trim().length >= 2) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-[var(--muted-foreground)] ${
            variant === "planner"
              ? "py-3 text-sm sm:text-base"
              : "py-3 text-base sm:text-lg"
          } ${inputClassName}`}
          aria-label={variant === "planner" ? "Where do you want to explore?" : undefined}
          style={{ color: "var(--foreground)" }}
        />
        {loading && (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-60" aria-hidden="true" />
        )}
        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-1 opacity-50 transition-opacity hover:opacity-100"
            aria-label="Clear location search"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
        {variant === "hero" && (
          <MapPin
            className="hidden h-5 w-5 shrink-0 opacity-30 sm:block"
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="sr-only" aria-live="polite">
        {loading && "Searching locations"}
        {error && error}
        {!loading && !error && results.length === 0 && inputValue.trim().length >= 2 && isOpen
          ? "No places found"
          : null}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.ul
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: dropdownMotionOffset }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: dropdownMotionOffset }}
            className={`theme-surface-elevated absolute left-0 right-0 z-50 max-h-64 w-full overflow-y-auto overscroll-contain rounded-2xl border py-1 shadow-xl ${dropdownPositionClass}`}
            style={{ borderColor: "var(--border)" }}
          >
            {loading && results.length === 0 && (
              <li className="theme-text-muted px-4 py-3 text-sm">Searching…</li>
            )}
            {error && (
              <li className="px-4 py-3 text-sm text-red-600 dark:text-red-300" role="alert">
                {error}
              </li>
            )}
            {!loading && !error && results.length === 0 && inputValue.trim().length >= 2 && (
              <li className="theme-text-muted px-4 py-3 text-sm">
                No places found. Try a city or country name.
              </li>
            )}
            {results.map((location, index) => (
              <li
                key={location.id}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    index === activeIndex ? "theme-text" : "theme-text-muted"
                  }`}
                  style={{
                    background: index === activeIndex ? "var(--accent-muted)" : "transparent",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => handleSelect(location)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{location.displayLabel}</span>
                    {location.kind === "country" && (
                      <span className="theme-text-subtle text-xs">Country</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

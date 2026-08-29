"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { EditablePlannerStep, ReviewPreferenceItem } from "@/lib/planner-constants";

interface PlannerReviewSummaryProps {
  preferences: ReviewPreferenceItem[];
  onEditStep: (step: EditablePlannerStep) => void;
}

export function PlannerReviewSummary({ preferences, onEditStep }: PlannerReviewSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <section
      className="glass-card mb-4 overflow-hidden rounded-2xl border border-[var(--border)]"
      aria-label="Review your trip context"
    >
      <div className="theme-divider flex items-center justify-between gap-3 border-b px-4 py-3 sm:px-5">
        <h2 className="theme-text text-sm font-semibold tracking-tight sm:text-base">
          Review your trip context
        </h2>
        <button
          type="button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          className="theme-text-subtle inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors hover:text-[var(--foreground)]"
          aria-expanded={isExpanded}
          aria-controls="planner-review-preferences"
        >
          {isExpanded ? "Collapse" : "Expand"}
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.ul
            id="planner-review-preferences"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="divide-y divide-[var(--border)] overflow-hidden"
          >
            {preferences.map((preference) => (
              <li key={preference.step}>
                <div className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5 sm:py-4">
                  <div className="min-w-0 flex-1">
                    <p className="theme-text-subtle text-[11px] font-medium uppercase tracking-[0.12em]">
                      {preference.label}
                    </p>
                    <p className="theme-text mt-1 text-sm leading-snug sm:text-base">
                      {preference.value}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEditStep(preference.step)}
                    className="theme-text-subtle shrink-0 pt-0.5 text-sm font-medium transition-colors hover:text-[var(--foreground)]"
                  >
                    Change
                  </button>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </section>
  );
}

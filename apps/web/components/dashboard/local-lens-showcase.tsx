"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2 } from "lucide-react";
import type { LensMode } from "@culturecompass/shared";
import { LENS_MODE_LABELS } from "@culturecompass/shared";
import { PlaceLink } from "@/components/place/place-link";
import { type LensSpot } from "@/lib/local-lens-helpers";

interface LocalLensShowcaseProps {
  spots: LensSpot[];
  mode: LensMode;
  destinationContext?: string;
  loading?: boolean;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

export function LocalLensShowcase({
  spots,
  mode,
  destinationContext,
  loading,
}: LocalLensShowcaseProps) {
  return (
    <section aria-label={`${LENS_MODE_LABELS[mode]} recommendations`} className="mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="theme-text text-sm font-semibold uppercase tracking-wider">
          {mode === "tourist" ? "Famous Attractions" : "Local Picks"}
        </h3>
        {loading && (
          <span className="theme-text-muted flex items-center gap-2 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Refreshing with Gemini…
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={mode + (loading ? "-loading" : "")}
          variants={listVariants}
          initial="hidden"
          animate={loading ? "hidden" : "show"}
          exit={{ opacity: 0 }}
          className="space-y-3"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={`skel-${i}`}
                  className="glass-card animate-shimmer h-20 rounded-2xl"
                  aria-hidden="true"
                />
              ))
            : spots.slice(0, 6).map((spot) => (
                <motion.li key={`${mode}-${spot.name}`} variants={itemVariants}>
                  <article className="glass-card flex gap-4 rounded-2xl p-4 sm:p-5">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: "var(--accent-muted)" }}
                    >
                      <MapPin className="h-4 w-4 opacity-70" strokeWidth={1.75} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="theme-text font-semibold">
                          <PlaceLink
                            name={spot.name}
                            destinationContext={destinationContext}
                            className="font-semibold no-underline hover:underline"
                          />
                        </h4>
                        <span className="theme-badge text-[10px]">{spot.category}</span>
                      </div>
                      <p className="theme-text-muted mt-1 text-sm leading-relaxed">
                        {spot.description}
                      </p>
                      {spot.tip && (
                        <p className="theme-text-subtle mt-2 text-xs italic">{spot.tip}</p>
                      )}
                    </div>
                  </article>
                </motion.li>
              ))}
        </motion.ul>
      </AnimatePresence>
    </section>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { PlaceLink } from "@/components/place/place-link";
import type { DashboardBullet, DashboardCardContent } from "@/lib/dashboard-helpers";

interface DashboardDetailSheetProps {
  card: DashboardCardContent | null;
  destinationContext?: string;
  storyHref?: string;
  onClose: () => void;
}

function renderBullet(bullet: DashboardBullet, destinationContext?: string) {
  if (bullet.placeName) {
    return (
      <>
        <PlaceLink
          name={bullet.placeName}
          destinationContext={destinationContext}
          className="font-medium"
        />
        {bullet.locationName ? (
          <>
            {" "}
            at{" "}
            <PlaceLink
              name={bullet.locationName}
              destinationContext={destinationContext}
              className="font-medium"
            />
          </>
        ) : null}
        {bullet.text ? ` — ${bullet.text}` : null}
      </>
    );
  }

  return bullet.text;
}

export function DashboardDetailSheet({
  card,
  destinationContext,
  storyHref,
  onClose,
}: DashboardDetailSheetProps) {
  return (
    <AnimatePresence>
      {card && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-sheet-title"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-hidden rounded-t-3xl border-t border-[var(--border)] bg-[var(--background)] shadow-2xl sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-lg sm:-translate-x-1/2"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 id="dashboard-sheet-title" className="theme-text text-lg font-semibold">
                {card.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-[var(--accent-muted)]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-5">
              <p className="theme-text-muted text-sm leading-relaxed">{card.summary}</p>
              <ul className="mt-5 space-y-3">
                {card.bullets.map((bullet, i) => (
                  <motion.li
                    key={`${card.id}-${i}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="theme-text flex gap-3 text-sm leading-relaxed"
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                    {renderBullet(bullet, destinationContext)}
                  </motion.li>
                ))}
              </ul>
              {card.footer && (
                <p className="theme-text-subtle mt-5 border-t border-[var(--border)] pt-4 text-sm italic leading-relaxed">
                  {card.footer}
                </p>
              )}
              {card.id === "story" && storyHref && (
                <a
                  href={storyHref}
                  className="cta-glow mt-6 inline-flex rounded-full px-6 py-3 text-sm font-semibold"
                >
                  Read the full legend
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

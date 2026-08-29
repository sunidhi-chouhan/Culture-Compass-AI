"use client";

import { Check, ChevronDown, Luggage, Plus, RefreshCw, Sparkles } from "lucide-react";
import type { PackingItem, PackingList } from "@culturecompass/shared";
import type { PackingStatus } from "@/hooks/use-packing";

interface PackingPreparePanelProps {
  packing: PackingList | null;
  status: PackingStatus;
  errorMessage?: string | null;
  statusLine?: string;
  climateNotes: string;
  activityNotes: string;
  extraDraft: string;
  packedCount: number;
  totalCount: number;
  essentialRemaining: number;
  tripSummary?: string | null;
  destination?: string | null;
  journeyStale?: boolean;
  canGenerate: boolean;
  isBusy: boolean;
  onClimateNotesChange: (value: string) => void;
  onActivityNotesChange: (value: string) => void;
  onExtraDraftChange: (value: string) => void;
  onGenerate: () => void;
  onTogglePacked: (itemId: string) => void;
  onAddExtra: () => void;
  onReset: () => void;
}

const CATEGORY_META: Array<{ keys: string[]; label: string }> = [
  { keys: ["documents", "essentials"], label: "Essentials" },
  { keys: ["clothing"], label: "Clothing" },
  { keys: ["footwear"], label: "Footwear" },
  { keys: ["health"], label: "Health & Personal" },
  { keys: ["electronics", "tech"], label: "Electronics" },
  { keys: ["activity", "outdoors", "experiences"], label: "Activity-specific" },
  { keys: ["comfort"], label: "Comfort" },
  { keys: ["personal", "preference", "general"], label: "Personal" },
];

function groupByCategory(
  items: PackingItem[],
): Array<{ label: string; items: PackingItem[] }> {
  const used = new Set<string>();
  const groups: Array<{ label: string; items: PackingItem[] }> = [];

  for (const meta of CATEGORY_META) {
    const matched = items.filter((item) => {
      const key = (item.category || "general").toLowerCase();
      if (used.has(item.id)) return false;
      if (meta.keys.includes(key)) {
        used.add(item.id);
        return true;
      }
      // Essentials section also pulls essential documents-adjacent items once
      if (
        meta.label === "Essentials" &&
        item.essential &&
        (item.source === "essentials" || key === "documents") &&
        !used.has(item.id)
      ) {
        used.add(item.id);
        return true;
      }
      return false;
    });
    if (matched.length) groups.push({ label: meta.label, items: matched });
  }

  const leftovers = items.filter((i) => !used.has(i.id));
  if (leftovers.length) groups.push({ label: "More", items: leftovers });
  return groups;
}

function progressCopy(
  packedCount: number,
  totalCount: number,
  essentialRemaining: number,
): string | null {
  if (totalCount === 0) return null;
  const progress = Math.round((packedCount / totalCount) * 100);
  if (packedCount === 0) return null;
  if (essentialRemaining === 0 && progress >= 90) return "You're ready to go.";
  if (essentialRemaining > 0 && progress >= 40) {
    return `Almost ready · ${essentialRemaining} essential${essentialRemaining === 1 ? "" : "s"} still missing.`;
  }
  if (essentialRemaining > 0) {
    return `${essentialRemaining} essential${essentialRemaining === 1 ? "" : "s"} still missing.`;
  }
  return null;
}

export function PackingPreparePanel({
  packing,
  status,
  errorMessage = null,
  statusLine = "Building a checklist…",
  climateNotes,
  activityNotes,
  extraDraft,
  packedCount,
  totalCount,
  essentialRemaining,
  tripSummary = null,
  destination = null,
  journeyStale = false,
  canGenerate,
  isBusy,
  onClimateNotesChange,
  onActivityNotesChange,
  onExtraDraftChange,
  onGenerate,
  onTogglePacked,
  onAddExtra,
  onReset,
}: PackingPreparePanelProps) {
  const groups = packing ? groupByCategory(packing.items) : [];
  const progress =
    totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;
  const statusHint = progressCopy(packedCount, totalCount, essentialRemaining);
  const itineraryItems = packing?.items.filter((i) => i.source === "itinerary") ?? [];
  const itineraryCount =
    packing?.insights?.itineraryAddedCount ?? itineraryItems.length;
  const weatherLines = packing?.insights?.weather ?? [];
  const activityLines = packing?.insights?.activity ?? [];
  const place = destination || packing?.tripSummary?.split("·")[0]?.trim() || "this trip";

  return (
    <section
      id="prepare-packing"
      className="mx-auto max-w-6xl scroll-mt-24 px-4 sm:px-6"
      aria-label="Prepare packing"
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="theme-badge text-[10px] tracking-[0.18em]">Prepare · Packing</p>
          <h2 className="theme-text mt-2 font-serif text-2xl font-semibold tracking-tight">
            Pack for {place}
          </h2>
          <p className="theme-text-muted mt-1 max-w-xl text-sm">
            Tailored to your destination, itinerary, activities, and trip length — not a generic
            checklist.
          </p>
          {tripSummary ? (
            <p className="theme-text mt-3 inline-flex max-w-full rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium">
              {tripSummary}
            </p>
          ) : null}
        </div>
        {totalCount > 0 ? (
          <div className="text-right">
            <p className="theme-text text-sm font-medium tabular-nums">
              {packedCount}/{totalCount} packed · {progress}%
            </p>
            {statusHint ? (
              <p className="theme-text-muted mt-1 text-xs" aria-live="polite" role="status">
                {statusHint}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="glass-card space-y-5 rounded-2xl border p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="theme-text-subtle text-xs font-medium">Climate notes</span>
            <input
              type="text"
              value={climateNotes}
              onChange={(e) => onClimateNotesChange(e.target.value)}
              placeholder="e.g. Mild evenings, chance of rain"
              maxLength={300}
              className="theme-text mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
            />
          </label>
          <label className="block">
            <span className="theme-text-subtle text-xs font-medium">Activity notes</span>
            <input
              type="text"
              value={activityNotes}
              onChange={(e) => onActivityNotesChange(e.target.value)}
              placeholder="e.g. Markets, temples, one hike"
              maxLength={300}
              className="theme-text mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={!canGenerate || isBusy}
            className="cta-glow inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {isBusy ? (
              <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : packing ? (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {packing ? "Refresh packing list" : "Prepare packing list"}
          </button>
          {packing ? (
            <button
              type="button"
              onClick={onReset}
              className="theme-text-subtle text-sm hover:text-[var(--foreground)]"
            >
              Clear checklist
            </button>
          ) : null}
        </div>

        {journeyStale ? (
          <p
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
            role="status"
          >
            Journey changed — refresh packing to match your new preferences and days.
          </p>
        ) : null}

        {status === "loading" ? (
          <p className="theme-text-muted flex items-center gap-2 text-sm" aria-live="polite">
            <Luggage className="h-4 w-4 opacity-70" aria-hidden="true" />
            {statusLine}
          </p>
        ) : null}

        {errorMessage ? (
          <p
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
            role="status"
          >
            Assist hiccup — showing a trip-aware draft you can still edit. ({errorMessage})
          </p>
        ) : null}

        {status === "idle" && !packing ? (
          <p className="theme-text-muted text-sm leading-relaxed">
            Add climate or activity notes if you like, then prepare a list built from this
            journey&apos;s destination, days, and itinerary.
          </p>
        ) : null}

        {packing ? (
          <div className="space-y-5">
            {(weatherLines.length > 0 || activityLines.length > 0) && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                <p className="theme-text-subtle text-[11px] font-semibold uppercase tracking-wider">
                  Weather & activity notes
                </p>
                <ul className="theme-text-muted mt-2 space-y-1 text-sm">
                  {weatherLines.map((line) => (
                    <li key={`w-${line}`}>{line}</li>
                  ))}
                  {activityLines.map((line) => (
                    <li key={`a-${line}`}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            {itineraryCount > 0 ? (
              <div className="rounded-xl border border-[var(--border)] px-4 py-3">
                <p className="theme-text text-sm font-medium">Based on your itinerary</p>
                <p className="theme-text-muted mt-1 text-sm">
                  {itineraryCount} item{itineraryCount === 1 ? "" : "s"} added for your planned
                  activities
                </p>
                {itineraryItems.length > 0 ? (
                  <ul className="theme-text-muted mt-2 space-y-1 text-sm">
                    {itineraryItems.slice(0, 4).map((item) => (
                      <li key={item.id}>· {item.label}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="theme-text-subtle mb-2 text-[11px] font-semibold uppercase tracking-wider">
                  {group.label}
                </h3>
                <ul className="space-y-1.5" aria-label={`${group.label} items`}>
                  {group.items.map((entry) => (
                    <PackingItemRow
                      key={entry.id}
                      item={entry}
                      onToggle={() => onTogglePacked(entry.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}

            <div className="border-t border-[var(--border)] pt-4">
              <label htmlFor="packing-extra" className="theme-text-subtle text-xs font-medium">
                Add your own item
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="packing-extra"
                  type="text"
                  value={extraDraft}
                  onChange={(e) => onExtraDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onAddExtra();
                    }
                  }}
                  placeholder="e.g. Reusable shopping tote"
                  maxLength={100}
                  className="theme-text w-full flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--foreground)]"
                />
                <button
                  type="button"
                  onClick={onAddExtra}
                  disabled={!extraDraft.trim()}
                  className="theme-text inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--border)] px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function PackingItemRow({
  item,
  onToggle,
}: {
  item: PackingItem;
  onToggle: () => void;
}) {
  const why = item.notes || item.reason;
  const quantity =
    item.quantityLabel || (item.quantity != null ? String(item.quantity) : null);

  return (
    <li className="rounded-xl border border-transparent hover:border-[var(--border)] hover:bg-[var(--surface)]">
      <div className="flex items-start gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-pressed={item.packed}
        >
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
              item.packed
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-[var(--background)]"
                : "border-[var(--border)]"
            }`}
            aria-hidden="true"
          >
            {item.packed ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={`theme-text flex flex-wrap items-baseline gap-x-2 text-sm font-medium ${item.packed ? "line-through opacity-70" : ""}`}
            >
              {item.label}
              {quantity ? (
                <span className="theme-text-subtle text-xs font-semibold tabular-nums">
                  × {quantity}
                </span>
              ) : null}
              {item.essential ? (
                <span className="theme-text-subtle text-[10px] font-semibold uppercase tracking-wide">
                  Essential
                </span>
              ) : item.source === "itinerary" ? (
                <span className="theme-text-subtle text-[10px] font-semibold uppercase tracking-wide">
                  Recommended
                </span>
              ) : null}
            </span>
            {item.reason ? (
              <span className="theme-text-muted mt-0.5 block text-xs leading-relaxed">
                {item.reason}
              </span>
            ) : null}
          </span>
        </button>
      </div>
      {why && why !== item.reason ? (
        <details className="border-t border-[var(--border)] px-3 py-2">
          <summary className="theme-text-subtle flex cursor-pointer items-center gap-1 text-xs font-medium">
            Why am I packing this?
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </summary>
          <p className="theme-text-muted mt-1.5 text-xs leading-relaxed">{why}</p>
        </details>
      ) : item.reason ? (
        <details className="border-t border-[var(--border)] px-3 py-2">
          <summary className="theme-text-subtle flex cursor-pointer items-center gap-1 text-xs font-medium">
            Why am I packing this?
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </summary>
          <p className="theme-text-muted mt-1.5 text-xs leading-relaxed">{item.reason}</p>
        </details>
      ) : null}
    </li>
  );
}

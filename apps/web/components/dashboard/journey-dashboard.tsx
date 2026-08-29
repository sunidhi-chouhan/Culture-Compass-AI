"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Gem,
  Landmark,
  UtensilsCrossed,
  Calendar,
  BookOpen,
  Wallet,
  Lightbulb,
  ShoppingBag,
  HandHeart,
  CloudSun,
  Sun,
  Star,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { CompassPlanResponse } from "@culturecompass/shared";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardDetailSheet } from "@/components/dashboard/dashboard-detail-sheet";
import {
  buildDashboardCards,
  getDestinationHeroUrl,
  resolveDashboardMeta,
  type DashboardCardContent,
  type DashboardCardId,
} from "@/lib/dashboard-helpers";
import { LocalLensToggle } from "@/components/dashboard/local-lens-toggle";
import { LocalLensShowcase } from "@/components/dashboard/local-lens-showcase";
import { StoryModeCard } from "@/components/story/story-mode-card";
import {
  DayItineraryPanel,
  type ItineraryPanelStatus,
} from "@/components/itinerary/day-itinerary-panel";
import { JourneyCompanionNav } from "@/components/journey/journey-companion-nav";
import { JourneyStageRail } from "@/components/journey/journey-stage-rail";
import { getLensSpots } from "@/lib/local-lens-helpers";
import type { LensMode, TripItinerary } from "@culturecompass/shared";
import type { ReactNode } from "react";

const CARD_ICONS: Record<DashboardCardId, LucideIcon> = {
  "hidden-gems": Gem,
  heritage: Landmark,
  food: UtensilsCrossed,
  events: Calendar,
  story: BookOpen,
  budget: Wallet,
  "local-tips": Lightbulb,
  shopping: ShoppingBag,
  etiquette: HandHeart,
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.35 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" as const } },
};

interface JourneyDashboardProps {
  plan: CompassPlanResponse;
  lensMode: LensMode;
  lensLoading?: boolean;
  onLensModeChange: (mode: LensMode) => void;
  itinerary?: TripItinerary | null;
  itineraryStatus?: ItineraryPanelStatus;
  itineraryError?: string | null;
  itineraryStatusLine?: string;
  itineraryRefreshing?: boolean;
  onRetryItinerary?: () => void;
  /** Improve stage — TripMate panel (non-blocking). */
  improvePanel?: ReactNode;
  /** Library — save current journey. */
  libraryPanel?: ReactNode;
  /** Prepare — packing checklist. */
  packingPanel?: ReactNode;
  /** Day to focus after TripMate Apply. */
  focusDayNumber?: number | null;
}

export function JourneyDashboard({
  plan,
  lensMode,
  lensLoading,
  onLensModeChange,
  itinerary = null,
  itineraryStatus = "idle",
  itineraryError = null,
  itineraryStatusLine,
  itineraryRefreshing = false,
  onRetryItinerary,
  improvePanel,
  libraryPanel,
  packingPanel,
  focusDayNumber = null,
}: JourneyDashboardProps) {
  const [activeCard, setActiveCard] = useState<DashboardCardContent | null>(null);
  const dest = plan.featuredDestination;
  const dashboard = resolveDashboardMeta(plan);
  const cards = buildDashboardCards(plan);
  const lensSpots = getLensSpots(plan, lensMode);
  const heroUrl = getDestinationHeroUrl(dest.id);
  const storyHref = `/story/${dest.id}?name=${encodeURIComponent(dest.name)}`;
  const destinationContext = `${dest.name}, ${dest.country}`;

  return (
    <div className="min-h-[calc(100dvh-4.5rem)] pb-16">
      <div className="theme-divider border-b px-4 py-2.5 sm:px-6">
        <JourneyStageRail current="Explore" compact />
      </div>
      <JourneyCompanionNav active="Explore" />

      {/* Hero — compact so Explore days land near the first viewport */}
      <section className="relative h-[min(36vh,280px)] w-full overflow-hidden sm:h-[min(40vh,320px)]">
        <Image
          src={heroUrl}
          alt={`${dest.name}, ${dest.country}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--background) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.25) 100%)",
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-end px-4 pb-8 sm:px-8">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="mx-auto w-full max-w-6xl"
          >
            <motion.div variants={heroItem}>
              <Link
                href="/"
                className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Home
              </Link>
            </motion.div>
            <motion.p variants={heroItem} className="text-sm font-medium text-white/80">
              Explore · {dest.country}
            </motion.p>
            <motion.h1
              variants={heroItem}
              className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl"
            >
              {dest.name}
            </motion.h1>
            <motion.p variants={heroItem} className="mt-2 max-w-xl text-sm text-white/85 sm:text-base">
              {dest.tagline}
            </motion.p>
            <motion.div variants={heroItem} className="mt-4">
              <a
                href="#explore-days"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-white/25"
              >
                Jump to your days
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats strip */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="relative z-10 -mt-6 mx-auto max-w-6xl px-4 sm:px-6"
      >
        <div className="glass-card grid grid-cols-2 gap-px overflow-hidden rounded-2xl border sm:grid-cols-4">
          <StatPill icon={CloudSun} label="Weather" value={dashboard.weather} />
          <StatPill icon={Sun} label="Best Season" value={dest.bestTimeToVisit} />
          <StatPill
            icon={Star}
            label="Cultural Rating"
            value={`${dashboard.culturalRating}/10`}
          />
          <StatPill
            icon={Sparkles}
            label="AI Match"
            value={`${dashboard.aiMatchScore}%`}
            highlight
          />
        </div>
      </motion.div>

      {/* Explore — day-wise itinerary leads */}
      <div className="relative z-10 mt-8 sm:mt-10">
        <DayItineraryPanel
          status={itineraryStatus}
          itinerary={itinerary ?? plan.itinerary ?? null}
          destinationContext={destinationContext}
          errorMessage={itineraryError}
          statusLine={itineraryStatusLine}
          isRefreshing={itineraryRefreshing}
          onRetry={onRetryItinerary}
          autoFocus
          focusDayNumber={focusDayNumber}
        />
      </div>

      {improvePanel ? (
        <div className="relative z-10 mt-10 sm:mt-12">{improvePanel}</div>
      ) : null}

      {packingPanel ? (
        <div className="relative z-10 mt-10 sm:mt-12">{packingPanel}</div>
      ) : null}

      {libraryPanel ? (
        <div className="relative z-10 mt-10 sm:mt-12">{libraryPanel}</div>
      ) : null}

      {/* Cultural insight — secondary */}
      <div className="relative z-10 mx-auto mt-10 max-w-6xl px-4 sm:px-6">
        <p className="theme-badge text-[10px] tracking-[0.18em]">Explore · Cultural insight</p>
        <h2 className="theme-text mt-2 font-serif text-2xl font-semibold tracking-tight">
          Cultural texture
        </h2>
        <p className="theme-text-muted mt-1 mb-6 max-w-xl text-sm">
          Stories, local lens, and places that give your days meaning.
        </p>
        <StoryModeCard plan={plan} destinationName={dest.name} />
      </div>

      {/* Local Lens — highly visible */}
      <div className="relative z-10 mx-auto mt-8 max-w-6xl px-4 sm:px-6">
        <LocalLensToggle mode={lensMode} loading={lensLoading} onChange={onLensModeChange} />
        <LocalLensShowcase
          spots={lensSpots}
          mode={lensMode}
          destinationContext={destinationContext}
          loading={lensLoading}
        />
      </div>

      {/* Cards grid */}
      <section className="mx-auto mt-10 max-w-6xl px-4 sm:mt-12 sm:px-6" aria-label="Journey insights">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-6"
        >
          <h2 className="theme-text font-serif text-2xl font-semibold tracking-tight">
            Your cultural journey
          </h2>
          <p className="theme-text-muted mt-1 text-sm">
            Tap a card to explore what JourneyMind discovered for you.
          </p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {cards.map((card) => {
            const Icon = CARD_ICONS[card.id];
            return (
              <DashboardCard
                key={card.id}
                title={card.title}
                summary={card.summary}
                icon={Icon}
                onClick={() => setActiveCard(card)}
              />
            );
          })}
        </motion.div>
      </section>

      <DashboardDetailSheet
        card={activeCard}
        destinationContext={destinationContext}
        storyHref={storyHref}
        onClose={() => setActiveCard(null)}
      />
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2 p-4 sm:p-5"
      style={{ background: "var(--surface)" }}
    >
      <div className="flex items-center gap-2">
        <Icon
          className="h-4 w-4 shrink-0"
          style={{ color: highlight ? "var(--foreground)" : "var(--muted)" }}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <span className="theme-text-subtle text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p
        className={`text-sm font-semibold leading-snug ${highlight ? "theme-text" : "theme-text-muted"}`}
      >
        {value}
      </p>
    </div>
  );
}

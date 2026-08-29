"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, BookMarked, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Location } from "@culturecompass/shared";
import { AnimatedGlobe } from "@/components/landing/animated-globe";
import { FloatingCulturalIcons } from "@/components/landing/floating-cultural-icons";
import { FeatureCards } from "@/components/landing/feature-cards";
import { LocationSearch } from "@/components/location/location-search";
import {
  TryDestinationsSection,
  type TryDestinationsStatus,
} from "@/components/landing/try-destinations-section";
import { fetchFeaturedDestinations } from "@/lib/destinations/fetch-featured-destinations";
import { writePlannerLocation } from "@/lib/planner-location";
import { clearActivePlannerSession } from "@/lib/planner-session-storage";
import { JourneyStageRail } from "@/components/journey/journey-stage-rail";

const TRY_DESTINATIONS_SEED_KEY = "tryDestinationsSeed";
const TRY_DESTINATIONS_LIMIT = 5;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

function getOrCreateSessionSeed(): string {
  const existing = sessionStorage.getItem(TRY_DESTINATIONS_SEED_KEY);
  if (existing) return existing;

  const seed = String(Date.now());
  sessionStorage.setItem(TRY_DESTINATIONS_SEED_KEY, seed);
  return seed;
}

export function LandingPage() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [searchSelection, setSearchSelection] = useState<Location | null>(null);
  const [inputText, setInputText] = useState("");
  const [tryDestinations, setTryDestinations] = useState<Location[]>([]);
  const [tryStatus, setTryStatus] = useState<TryDestinationsStatus>("loading");
  const pendingLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const sessionSeed = getOrCreateSessionSeed();

    fetchFeaturedDestinations({
      limit: TRY_DESTINATIONS_LIMIT,
      sessionSeed,
      signal: controller.signal,
    })
      .then((response) => {
        if (response.results.length === 0) {
          setTryDestinations([]);
          setTryStatus("empty");
          return;
        }

        setTryDestinations(response.results);
        setTryStatus("ready");
      })
      .catch(() => {
        setTryDestinations([]);
        setTryStatus("error");
      });

    return () => controller.abort();
  }, []);

  function beginFreshPlan(options: {
    location?: Location | null;
    destinationText?: string;
    mode?: "create" | "improve";
  }) {
    clearActivePlannerSession(sessionStorage, { clearPlannerLocation: true });

    const params = new URLSearchParams();
    const location = options.location ?? null;
    const destinationText = options.destinationText?.trim() ?? "";

    if (location) {
      params.set("destination", location.displayLabel);
      writePlannerLocation(sessionStorage, location);
    } else if (destinationText) {
      params.set("destination", destinationText);
      writePlannerLocation(sessionStorage, null, destinationText);
    }

    if (options.mode === "improve") {
      params.set("mode", "improve");
    }

    const query = params.toString();
    router.push(query ? `/plan?${query}` : "/plan");
  }

  function handleStartExploring() {
    const location = selectedLocation ?? pendingLocationRef.current;
    beginFreshPlan({
      location,
      destinationText: inputText,
      mode: "create",
    });
  }

  function handleImprovePlan() {
    beginFreshPlan({ mode: "improve" });
  }

  function handleLocationChange(location: Location | null) {
    setSelectedLocation(location);
    pendingLocationRef.current = location;

    if (location) {
      writePlannerLocation(sessionStorage, location);
    } else if (!inputText.trim()) {
      writePlannerLocation(sessionStorage, null);
    }
  }

  function handleTryDestination(location: Location) {
    setSelectedLocation(location);
    setSearchSelection(location);
    pendingLocationRef.current = location;
    setInputText(location.displayLabel);
    writePlannerLocation(sessionStorage, location);
  }

  return (
    <div className="landing-full-bleed">
      <section className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center overflow-x-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AnimatedGlobe />
        <FloatingCulturalIcons />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center overflow-visible text-center">
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="theme-badge mb-6 text-[11px] tracking-[0.2em]"
          >
            Discover
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            JourneyMind
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="theme-text mt-4 max-w-xl text-lg font-medium leading-snug sm:text-xl"
          >
            Turn scattered trip ideas into a journey you can actually take.
          </motion.p>

          <motion.p
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="theme-text-muted mt-3 max-w-lg text-sm sm:text-base"
          >
            Preferences, rough plans, and cultural intent — woven into one companion that helps you
            create, explore, and improve your trip.
          </motion.p>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 w-full overflow-visible"
          >
            <LocationSearch
              id="hero-destination"
              variant="hero"
              selection={searchSelection}
              onLocationChange={handleLocationChange}
              onInputTextChange={setInputText}
            />

            <TryDestinationsSection
              status={tryStatus}
              destinations={tryDestinations}
              skeletonCount={TRY_DESTINATIONS_LIMIT}
              onSelect={handleTryDestination}
            />
          </motion.div>

          <motion.div
            custom={5}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:items-center sm:justify-center"
          >
            <motion.button
              type="button"
              onClick={handleStartExploring}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cta-glow inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-shadow sm:px-10 sm:text-lg"
            >
              Start Exploring
              <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </motion.button>
            <motion.button
              type="button"
              onClick={handleImprovePlan}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="theme-text inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 py-3.5 text-sm font-semibold transition-colors hover:border-[var(--foreground)] sm:px-8 sm:text-base"
            >
              <Sparkles className="h-4 w-4 opacity-70" strokeWidth={1.75} aria-hidden="true" />
              Improve my plan
            </motion.button>
          </motion.div>

          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-5 flex flex-col items-center gap-4"
          >
            <Link
              href="/journeys"
              className="theme-text-muted inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:text-[var(--foreground)] hover:underline"
            >
              <BookMarked className="h-3.5 w-3.5 opacity-70" strokeWidth={1.75} aria-hidden="true" />
              My journeys
            </Link>
            <JourneyStageRail current="Discover" compact className="justify-center" />
          </motion.div>
        </div>
      </section>

      <FeatureCards />
    </div>
  );
}

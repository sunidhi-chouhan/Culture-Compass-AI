"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { Location } from "@culturecompass/shared";
import { AnimatedGlobe } from "@/components/landing/animated-globe";
import { FloatingCulturalIcons } from "@/components/landing/floating-cultural-icons";
import { FeatureCards } from "@/components/landing/feature-cards";
import { LocationSearch } from "@/components/location/location-search";

const EXAMPLE_DESTINATIONS = ["Jaipur", "Kyoto", "Bali", "Rome", "Kerala"] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: "easeOut" as const },
  }),
};

export function LandingPage() {
  const router = useRouter();
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [inputText, setInputText] = useState("");
  const [tryChipKey, setTryChipKey] = useState(0);
  const [tryChipText, setTryChipText] = useState("");
  const pendingLocationRef = useRef<Location | null>(null);

  function handleStartExploring() {
    const location = selectedLocation ?? pendingLocationRef.current;
    const params = new URLSearchParams();

    if (location) {
      params.set("destination", location.displayLabel);
      sessionStorage.setItem("plannerLocation", JSON.stringify(location));
    } else if (inputText.trim()) {
      params.set("destination", inputText.trim());
      sessionStorage.removeItem("plannerLocation");
    } else {
      sessionStorage.removeItem("plannerLocation");
    }

    const query = params.toString();
    router.push(query ? `/plan?${query}` : "/plan");
  }

  function handleLocationChange(location: Location | null) {
    setSelectedLocation(location);
    pendingLocationRef.current = location;
  }

  function handleTryChip(place: string) {
    setSelectedLocation(null);
    pendingLocationRef.current = null;
    setTryChipText(place);
    setTryChipKey((key) => key + 1);
    setInputText(place);
    sessionStorage.removeItem("plannerLocation");
  }

  return (
    <div className="landing-full-bleed">
      <section className="relative flex min-h-[calc(100dvh-4.5rem)] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <AnimatedGlobe />
        <FloatingCulturalIcons />

        <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="theme-badge mb-6 text-[11px] tracking-[0.2em]"
          >
            AI Cultural Companion
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="font-serif text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Discover the Soul of
            <br />
            <span className="bg-gradient-to-r from-[var(--foreground)] to-[var(--muted)] bg-clip-text text-transparent">
              Every Destination
            </span>
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="theme-text-muted mt-5 max-w-md text-base sm:text-lg"
          >
            Your AI Cultural Companion powered by Gemini.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 w-full"
          >
            <LocationSearch
              key={tryChipKey}
              id="hero-destination"
              variant="hero"
              initialText={tryChipText}
              onLocationChange={handleLocationChange}
              onInputTextChange={setInputText}
            />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="theme-text-subtle text-xs">Try:</span>
              {EXAMPLE_DESTINATIONS.map((place) => (
                <button
                  key={place}
                  type="button"
                  onClick={() => handleTryChip(place)}
                  className="theme-chip text-xs sm:text-sm"
                >
                  {place}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8"
          >
            <motion.button
              type="button"
              onClick={handleStartExploring}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="cta-glow inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold shadow-lg transition-shadow sm:px-10 sm:py-4 sm:text-lg"
            >
              Start Exploring
              <ArrowRight className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <FeatureCards />
    </div>
  );
}

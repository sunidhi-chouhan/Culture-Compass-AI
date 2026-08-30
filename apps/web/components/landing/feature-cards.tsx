"use client";

import { motion } from "framer-motion";
import { CalendarDays, Compass, Sparkles } from "lucide-react";

const CARDS = [
  {
    icon: Compass,
    title: "Create with context",
    description:
      "Share where you're going, who you're with, and what you care about — JourneyMind holds the pieces together.",
  },
  {
    icon: CalendarDays,
    title: "Explore a real journey",
    description:
      "Move from inspiration to days you can follow — cultural depth without losing practical rhythm.",
  },
  {
    icon: Sparkles,
    title: "Improve as you go",
    description:
      "When a schedule feels crowded or thin, refine it with an intelligent companion — not another blank form.",
  },
] as const;

export function FeatureCards() {
  return (
    <section
      id="explore"
      className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6 lg:px-8"
      aria-labelledby="explore-heading"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <h2 id="explore-heading" className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
          From scattered ideas to a journey
        </h2>
        <p className="theme-text-muted mx-auto mt-3 max-w-lg text-sm sm:text-base">
          Discover, create, explore, and improve — one companion for a trip that feels intentional.
        </p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-3 sm:gap-6">
        {CARDS.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.article
              key={card.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{
                y: -6,
                transition: { duration: 0.25, ease: "easeOut" },
              }}
              className="glass-card group cursor-default rounded-3xl p-8"
            >
              <div
                className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ background: "var(--accent-muted)" }}
              >
                <Icon className="h-5 w-5 opacity-80" strokeWidth={1.75} aria-hidden="true" />
              </div>
              <h3 className="theme-text text-lg font-semibold tracking-tight">{card.title}</h3>
              <p className="theme-text-muted mt-3 text-sm leading-relaxed">{card.description}</p>
              <div
                className="mt-6 h-px w-0 transition-all duration-500 group-hover:w-full"
                style={{ background: "var(--border)" }}
              />
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

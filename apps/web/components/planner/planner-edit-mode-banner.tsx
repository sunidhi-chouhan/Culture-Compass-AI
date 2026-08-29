interface PlannerEditModeBannerProps {
  prompt: string;
}

export function PlannerEditModeBanner({ prompt }: PlannerEditModeBannerProps) {
  return (
    <div
      className="rounded-xl border px-4 py-3 sm:px-5 sm:py-4"
      style={{
        borderColor: "var(--border)",
        background: "var(--accent-muted)",
      }}
      role="status"
      aria-live="polite"
    >
      <p className="theme-text-subtle text-[11px] font-medium uppercase tracking-[0.12em]">
        Updating your journey
      </p>
      <p className="theme-text mt-1.5 text-sm leading-relaxed sm:text-base">{prompt}</p>
    </div>
  );
}

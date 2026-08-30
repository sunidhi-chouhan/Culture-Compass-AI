"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type {
  CompassPlanRequest,
  CompassPlanResponse,
  PackingList,
  TripItinerary,
} from "@culturecompass/shared";
import { buildJourneyExport } from "@/lib/journey-export";
import { downloadJourneyPdf } from "@/lib/journey-pdf";

interface DownloadJourneyButtonProps {
  plan: CompassPlanResponse;
  request?: CompassPlanRequest | null;
  itinerary?: TripItinerary | null;
  packing?: PackingList | null;
  title?: string;
  variant?: "primary" | "quiet";
}

export function DownloadJourneyButton({
  plan,
  request = null,
  itinerary = null,
  packing = null,
  title,
  variant = "quiet",
}: DownloadJourneyButtonProps) {
  const [status, setStatus] = useState<"idle" | "error">("idle");

  function handleDownload() {
    try {
      const model = buildJourneyExport({ plan, request, itinerary, packing, title });
      downloadJourneyPdf(model);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <span className="inline-flex flex-col items-stretch">
      <button
        type="button"
        onClick={handleDownload}
        className={
          variant === "primary"
            ? "cta-glow inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold"
            : "theme-text inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold hover:border-[var(--foreground)]"
        }
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Download journey
      </button>
      {status === "error" ? (
        <span className="mt-1 text-xs text-red-600 dark:text-red-300" role="status">
          Couldn’t create the PDF. Try again.
        </span>
      ) : null}
    </span>
  );
}

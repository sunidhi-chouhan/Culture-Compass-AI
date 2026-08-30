"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PlannerSession } from "@/components/planner/planner-session";
import { LoadingState } from "@culturecompass/ui";

function PlanPageContent() {
  const searchParams = useSearchParams();
  const destination = searchParams.get("destination") ?? "";

  return <PlannerSession initialDestination={destination} />;
}

export default function PlanPage() {
  return (
    <Suspense fallback={<LoadingState message="Opening JourneyMind…" />}>
      <PlanPageContent />
    </Suspense>
  );
}

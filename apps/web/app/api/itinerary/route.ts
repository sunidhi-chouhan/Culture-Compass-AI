import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@culturecompass/ai";
import { itineraryRequestSchema } from "@culturecompass/shared";
import { handleRouteError, parseJsonBody } from "@/lib/api-utils";
import { isMockAiEnabled } from "@/lib/mock/compass-plan";
import { getMockItinerary } from "@/lib/mock/itinerary";

/** Prefer longer runtime on Pro; Hobby still caps ~10s. */
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const input = await parseJsonBody(request, itineraryRequestSchema);

    if (isMockAiEnabled()) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return NextResponse.json({ itinerary: getMockItinerary(input) });
    }

    try {
      const result = await generateItinerary(input);
      return NextResponse.json(result);
    } catch (aiError) {
      // Demo safety net: keep Explore usable if Gemini rejects this call.
      console.error("[itinerary] Gemini failed; using mock itinerary", aiError);
      return NextResponse.json({ itinerary: getMockItinerary(input) });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}

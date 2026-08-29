import { NextRequest, NextResponse } from "next/server";
import { generateItinerary } from "@culturecompass/ai";
import { itineraryRequestSchema } from "@culturecompass/shared";
import { handleRouteError, parseJsonBody } from "@/lib/api-utils";
import { isMockAiEnabled } from "@/lib/mock/compass-plan";
import { getMockItinerary } from "@/lib/mock/itinerary";

export async function POST(request: NextRequest) {
  try {
    const input = await parseJsonBody(request, itineraryRequestSchema);

    if (isMockAiEnabled()) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      return NextResponse.json({ itinerary: getMockItinerary(input) });
    }

    const result = await generateItinerary(input);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

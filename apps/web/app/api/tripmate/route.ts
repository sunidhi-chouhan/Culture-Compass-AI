import { NextRequest, NextResponse } from "next/server";
import { generateTripMate } from "@culturecompass/ai";
import { tripMateRequestSchema } from "@culturecompass/shared";
import { handleRouteError, parseJsonBody } from "@/lib/api-utils";
import { isMockAiEnabled } from "@/lib/mock/compass-plan";
import { getMockTripMateResult } from "@/lib/mock/tripmate";

export async function POST(request: NextRequest) {
  try {
    const input = await parseJsonBody(request, tripMateRequestSchema);

    if (isMockAiEnabled()) {
      // Simulate analyze → propose latency; client shows verifying separately.
      await new Promise((resolve) => setTimeout(resolve, 900));
      return NextResponse.json(getMockTripMateResult(input));
    }

    const result = await generateTripMate(input);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

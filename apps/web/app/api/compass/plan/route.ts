import { NextRequest, NextResponse } from "next/server";
import { generateCompassPlan } from "@culturecompass/ai";
import { compassPlanRequestSchema } from "@culturecompass/shared";
import { handleRouteError, parseJsonBody } from "@/lib/api-utils";
import { getMockCompassPlan, isMockAiEnabled } from "@/lib/mock/compass-plan";

export async function POST(request: NextRequest) {
  try {
    const input = await parseJsonBody(request, compassPlanRequestSchema);

    if (isMockAiEnabled()) {
      await new Promise((resolve) => setTimeout(resolve, 600));
      return NextResponse.json(getMockCompassPlan(input));
    }

    const plan = await generateCompassPlan(input);
    return NextResponse.json(plan);
  } catch (error) {
    return handleRouteError(error);
  }
}

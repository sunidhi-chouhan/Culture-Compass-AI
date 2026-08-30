import { NextRequest, NextResponse } from "next/server";
import { generatePacking } from "@culturecompass/ai";
import { packingRequestSchema } from "@culturecompass/shared";
import { handleRouteError, parseJsonBody } from "@/lib/api-utils";
import { isMockAiEnabled } from "@/lib/mock/compass-plan";
import { getMockPackingList } from "@/lib/mock/packing";

export async function POST(request: NextRequest) {
  try {
    const input = await parseJsonBody(request, packingRequestSchema);

    if (isMockAiEnabled()) {
      await new Promise((resolve) => setTimeout(resolve, 650));
      return NextResponse.json({ packing: getMockPackingList(input) });
    }

    const result = await generatePacking(input);
    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

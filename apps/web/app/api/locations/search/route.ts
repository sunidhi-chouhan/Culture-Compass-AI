import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { locationSearchQuerySchema, locationSearchResponseSchema } from "@culturecompass/shared";
import { handleRouteError, jsonError } from "@/lib/api-utils";
import { queryLocations } from "@/lib/locations/location-index";
import { ERROR_CODES } from "@culturecompass/shared";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q");
    const limit = request.nextUrl.searchParams.get("limit") ?? undefined;

    if (q === null || q.trim() === "") {
      return jsonError("Query parameter q is required.", ERROR_CODES.VALIDATION_ERROR, 400);
    }

    const input = locationSearchQuerySchema.parse({
      q,
      ...(limit !== null ? { limit } : {}),
    });

    const results = queryLocations(input.q, input.limit);
    const response = locationSearchResponseSchema.parse({ results });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.errors.map((e) => e.message).join(", ");
      return jsonError(message, ERROR_CODES.VALIDATION_ERROR, 400);
    }

    return handleRouteError(error);
  }
}

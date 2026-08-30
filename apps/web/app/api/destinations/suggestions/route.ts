import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  ERROR_CODES,
  featuredDestinationsQuerySchema,
  featuredDestinationsResponseSchema,
  hashSeed,
} from "@culturecompass/shared";
import { handleRouteError, jsonError } from "@/lib/api-utils";
import { queryFeaturedDestinations } from "@/lib/destinations/destination-catalog";

function resolveSeed(request: NextRequest, explicitSeed: number | undefined): number {
  if (explicitSeed !== undefined && explicitSeed > 0) {
    return explicitSeed;
  }

  const sessionSeed = request.nextUrl.searchParams.get("session");
  if (sessionSeed && sessionSeed.trim()) {
    return hashSeed(sessionSeed.trim());
  }

  const dayBucket = new Date().toISOString().slice(0, 10);
  return hashSeed(dayBucket);
}

export async function GET(request: NextRequest) {
  try {
    const limitParam = request.nextUrl.searchParams.get("limit") ?? undefined;
    const seedParam = request.nextUrl.searchParams.get("seed") ?? undefined;

    const input = featuredDestinationsQuerySchema.parse({
      ...(limitParam !== null ? { limit: limitParam } : {}),
      ...(seedParam !== null ? { seed: seedParam } : {}),
    });

    const seed = resolveSeed(request, input.seed > 0 ? input.seed : undefined);
    const results = queryFeaturedDestinations(seed, input.limit);
    const response = featuredDestinationsResponseSchema.parse({ results, seed });

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.errors.map((e) => e.message).join(", ");
      return jsonError(message, ERROR_CODES.VALIDATION_ERROR, 400);
    }

    return handleRouteError(error);
  }
}

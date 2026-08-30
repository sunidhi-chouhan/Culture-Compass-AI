import type { NextResponse } from "next/server";

/** Shared security headers for API and page responses. */
export function applySecurityHeaders<T extends NextResponse>(response: T): T {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  return response;
}

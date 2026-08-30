import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { applySecurityHeaders } from "@/lib/security-headers";

export function middleware(request: NextRequest) {
  if (request.method === "POST" && request.nextUrl.pathname.startsWith("/api/")) {
    const rateLimited = checkRateLimit(request);
    if (rateLimited) {
      return applySecurityHeaders(rateLimited);
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

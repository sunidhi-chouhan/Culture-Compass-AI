import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { NextResponse } from "next/server";
import { applySecurityHeaders } from "./security-headers";

describe("applySecurityHeaders", () => {
  it("sets framing, sniffing, referrer, and permissions policies", () => {
    const response = applySecurityHeaders(NextResponse.next());
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
    assert.equal(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.equal(
      response.headers.get("Referrer-Policy"),
      "strict-origin-when-cross-origin",
    );
    assert.match(response.headers.get("Permissions-Policy") ?? "", /camera=\(\)/);
    assert.equal(response.headers.get("X-DNS-Prefetch-Control"), "off");
  });
});

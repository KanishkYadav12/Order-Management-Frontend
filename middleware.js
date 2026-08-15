import { NextResponse } from "next/server";

/**
 * Edge middleware.
 *
 * Authentication is enforced by the API on every request and by
 * `ProtectedRoute` in the client, which now blocks render until the session
 * resolves. The refresh token is an httpOnly cookie scoped to `/api/v1/auth`,
 * so the edge cannot read it and cannot make a trustworthy auth decision here
 * — a middleware check would be theatre.
 *
 * What it does do is add the security headers that belong on the document
 * response rather than on API responses.
 */
export function middleware() {
  const response = NextResponse.next();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  // Everything except Next's own assets and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};

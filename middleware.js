import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/settings", "/profile"];
const authPaths = ["/login", "/signup", "/forgot-password", "/verify-email"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Check for authToken in cookies (primary check)
  let authToken = request.cookies.get("authToken")?.value;

  console.log("🔐 Middleware - Checking auth for path:", pathname);
  console.log("🍪 Cookies:", request.cookies.getAll());
  console.log("✅ authToken found:", authToken ? "YES" : "NO");

  // Handle protected routes
  if (protectedPaths.some((path) => pathname.startsWith(path))) {
    if (!authToken) {
      console.log("❌ No auth token - Redirecting to /login");
      return NextResponse.redirect(new URL("/login", request.url));
    }
    console.log("✅ Auth token valid - Allowing access");
  }

  // Handle auth routes (redirect to dashboard if already logged in)
  if (authPaths.includes(pathname)) {
    if (authToken) {
      console.log("✅ Already logged in - Redirecting to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Handle root path
  if (pathname === "/") {
    if (authToken) {
      console.log("✅ Root path with auth - Redirecting to /dashboard");
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/verify-email",
    "/settings/:path*",
    "/profile/:path*",
  ],
};

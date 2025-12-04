// middleware.js
import { NextResponse } from "next/server";

export function middleware(request) {
  // No auth checks in edge middleware — client handles auth (localStorage/Redux).
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

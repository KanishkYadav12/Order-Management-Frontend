"use client";

import { useAuth } from "@/hooks/auth/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSelector } from "react-redux";

export default function ProtectedRoute({ children }) {
  const router = useRouter();

  // From your useAuth hook (assumed to depend on redux)
  const { isAuthenticated } = useAuth();

  // Direct Redux token (most reliable)
  const reduxToken = useSelector((state) => state?.auth?.authDetails?.token);

  // Fallback for page reloads before redux hydrates
  const getLocalToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    const token = reduxToken || getLocalToken();

    // If token does not exist anywhere → user is not logged in
    if (!token) {
      router.push("/login");
    }
  }, [router, reduxToken, isAuthenticated]);

  return children;
}

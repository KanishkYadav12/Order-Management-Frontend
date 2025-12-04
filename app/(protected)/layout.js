"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";

export default function ProtectedLayout({ children }) {
  const router = useRouter();

  // Read token from Redux
  const reduxToken = useSelector((state) => state?.auth?.authDetails?.token);

  // Fallback to localStorage for reloads
  const getLocalToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    const token = reduxToken || getLocalToken();

    // Not logged in → redirect
    if (!token) {
      router.push("/login");
    }
  }, [router, reduxToken]);

  return <>{children}</>;
}

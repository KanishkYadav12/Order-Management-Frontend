"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";

export default function Home() {
  const router = useRouter();

  // Read token from Redux (preferred) and fallback to localStorage for reloads
  const reduxToken = useSelector((state) => state?.auth?.authDetails?.token);
  const getLocalToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    const token = reduxToken || getLocalToken();
    if (token) {
      // If authenticated, redirect to dashboard
      router.push("/dashboard");
    }
  }, [router, reduxToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-6 space-y-8">
        <div className="text-center">
          <Building2 className="w-12 h-12 mx-auto text-primary" />
          <h1 className="mt-6 text-4xl font-bold text-gray-900">QR-Dine</h1>
          <p className="mt-2 text-lg text-gray-600">
            Contactless Ordering System{" "}
          </p>
        </div>

        <div className="flex flex-col space-y-4">
          <Link href="/login">
            <Button className="w-full" size="lg">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="w-full" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

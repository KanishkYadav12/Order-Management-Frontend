"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CookingPot } from "lucide-react";
import { useAuth } from "@/hooks/auth/useAuth";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * `/order-page` with no hotel in the path.
 *
 * This used to render a hardcoded "Invalid Order Page — please provide an
 * order ID in the URL", which is a developer's error message shown to a
 * restaurant manager. The id it wants is the signed-in user's own hotel, so
 * there is nothing to ask for: look it up and go.
 */
export default function OrderBoardRedirect() {
  const router = useRouter();
  const { hotelId, loading, isSuperAdmin } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (isSuperAdmin) router.replace("/admin-dashboard");
    else if (hotelId) router.replace(`/order-page/${hotelId}`);
  }, [loading, hotelId, isSuperAdmin, router]);

  if (!loading && !hotelId && !isSuperAdmin) {
    return (
      <EmptyState
        Icon={CookingPot}
        title="No restaurant linked to this account"
        description="The order board belongs to a restaurant. Finish setting yours up and it will open here."
        action={() => router.push("/dashboard/configuration")}
        actionLabel="Open settings"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-primary/10">
        <CookingPot className="h-6 w-6 text-primary" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium">Opening the kitchen board…</p>
    </div>
  );
}

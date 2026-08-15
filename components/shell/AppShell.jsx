"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { X, ChefHat, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SideNav from "./SideNav";
import TopBar from "./TopBar";
import { useAuth } from "@/hooks/auth/useAuth";
import { useGetUser } from "@/hooks/auth/useGetUser";
import useAbly from "@/hooks/ably/useAbly";
import { selectIsSystemOnline } from "@/redux/slices/systemSlice";
import { cn } from "@/lib/utils";

/**
 * Holds the realtime connection for the authenticated app.
 *
 * Only a restaurant has a live order channel, so a platform admin never opens
 * one — there is no hotel to subscribe to, and asking for a token without a
 * hotelId is a guaranteed 409.
 */
const RealtimeBridge = () => {
  const { hotelId, isSuperAdmin } = useAuth();
  const isSystemOnline = useSelector(selectIsSystemOnline);
  useAbly(isSuperAdmin ? null : hotelId, isSystemOnline);
  return null;
};

/** Pages a platform admin has no restaurant for. */
const TENANT_ONLY = ["/dashboard", "/order-page", "/bill"];
const ADMIN_ALLOWED = ["/dashboard/profile"];

/**
 * Sends each role to a page that works for them.
 *
 * A super admin landing on /dashboard hit "Add ?hotelId= to choose which
 * restaurant to act on" — a tenant-scoped screen asking a user with no tenant
 * to name one. They belong on the platform overview instead.
 */
const RoleRedirect = ({ children }) => {
  const { isSuperAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const misplaced =
    !loading &&
    isSuperAdmin &&
    TENANT_ONLY.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) &&
    !ADMIN_ALLOWED.includes(pathname);

  useEffect(() => {
    if (misplaced) router.replace("/admin-dashboard");
  }, [misplaced, router]);

  if (misplaced) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center" role="status">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Taking you to your overview…</span>
      </div>
    );
  }

  return children;
};

/**
 * The authenticated application frame: fixed sidebar on desktop, drawer on
 * mobile, sticky top bar.
 */
export default function AppShell({ children, title, roles }) {
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();

  // Loads the profile once for the whole shell rather than per screen.
  useGetUser();

  useEffect(() => setNavOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  return (
    <ProtectedRoute roles={roles}>
      <RealtimeBridge />

      <div className="flex min-h-screen bg-background">
        {navOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setNavOpen(false)}
            className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:translate-x-0",
            navOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex h-14 items-center gap-2 border-b px-4">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
                <ChefHat
                  className="h-4 w-4 text-primary-foreground"
                  aria-hidden="true"
                />
              </span>
              <span className="text-base font-bold tracking-tight">QR-Dine</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto lg:hidden"
              onClick={() => setNavOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <SideNav onNavigate={() => setNavOpen(false)} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
          <TopBar onOpenNav={() => setNavOpen(true)} title={title} />
          <main id="main" className="flex-1 p-4 sm:p-6">
            <div className="mx-auto w-full max-w-7xl">
              <RoleRedirect>{children}</RoleRedirect>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

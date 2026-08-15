"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/auth/useAuth";
import { Loader2 } from "lucide-react";

/**
 * Route guard.
 *
 * The previous implementation returned `children` immediately and redirected
 * from inside an effect, so a signed-out visitor saw a flash of the real
 * dashboard — and whatever data was still in the store — before being sent
 * away. Nothing renders here until the session state is actually known.
 *
 * @param {object} props
 * @param {string} [props.permission] Required permission, e.g. "bill:pay".
 * @param {string[]} [props.roles]    Allowed roles, when a role fits better.
 */
export default function ProtectedRoute({ children, permission, roles }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading, role, can } = useAuth();

  const allowed =
    isAuthenticated &&
    (!permission || can(permission)) &&
    (!roles || roles.includes(role));

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    // Signed in but not permitted here: send them somewhere they can use
    // rather than bouncing them back to a login form they've already passed.
    if (!allowed) router.replace("/dashboard");
  }, [loading, isAuthenticated, allowed, router, pathname]);

  if (loading || !allowed) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  return children;
}

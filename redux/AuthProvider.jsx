"use client";

import { useEffect, useRef } from "react";
import { Provider, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation";
import { store } from "./store.js";
import { restoreSession } from "./actions/auth/authAction.js";
import { authActions } from "./slices/authSlice.js";
import { setSessionExpiredHandler } from "@/lib/api";

/** Routes reachable without a session. */
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/forgot-password",
  "/email-confirmation",
];

const isPublicRoute = (pathname) =>
  PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/reset-password");

/**
 * Restores the session on first load and wires the client's
 * session-expired callback into the router.
 *
 * Previously nothing ran on load: the app read a long-lived token straight
 * out of localStorage and trusted it, so a revoked or expired session stayed
 * "logged in" until a request happened to fail.
 */
const SessionBootstrap = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();
  const started = useRef(false);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      dispatch(authActions.clearAuthState());
      if (!isPublicRoute(window.location.pathname)) {
        router.replace(
          `/login?next=${encodeURIComponent(window.location.pathname)}`
        );
      }
    });
  }, [dispatch, router]);

  useEffect(() => {
    // Runs exactly once per page load, not on every navigation.
    if (started.current) return;
    started.current = true;

    // Attempted on public routes too, so an already-signed-in visitor
    // landing on /login is sent onward rather than shown the form again.
    dispatch(restoreSession());
  }, [dispatch, pathname]);

  return children;
};

const StoreProvider = ({ children }) => (
  <Provider store={store}>
    <SessionBootstrap>{children}</SessionBootstrap>
  </Provider>
);

export default StoreProvider;

"use client";

import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  UserRoundCog,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setSystemOnline, selectIsSystemOnline } from "@/redux/slices/systemSlice";
import { selectConnectionError } from "@/redux/slices/connectionSlice";
import { useAuth } from "@/hooks/auth/useAuth";
import { useLogout } from "@/hooks/auth/useLogout";
import { useTheme } from "@/components/theme/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/config/config";
import { cn } from "@/lib/utils";

/** A short chime when a new order lands. */
const useOrderChime = (count, enabled) => {
  const previous = useRef(count);

  useEffect(() => {
    if (enabled && count > previous.current) {
      try {
        const Ctx = window.AudioContext ?? window.webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          osc.frequency.setValueAtTime(1170, ctx.currentTime + 0.12);
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc.start();
          osc.stop(ctx.currentTime + 0.36);
          osc.onended = () => ctx.close();
        }
      } catch {
        // A blocked chime is not worth surfacing.
      }
    }
    previous.current = count;
  }, [count, enabled]);
};

const initials = (name = "") =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";

export default function TopBar({ onOpenNav, title }) {
  const dispatch = useDispatch();
  const { toast } = useToast();
  const { user, role, isSuperAdmin, hotelName } = useAuth();
  const { handleLogout, loading: loggingOut } = useLogout();
  // `resolved` collapses "system" into the light/dark actually on screen,
  // which is what a two-way toggle needs to know which way to flip. Reading
  // matchMedia during render instead would risk a hydration mismatch.
  const { resolved, setTheme } = useTheme();

  const isSystemOnline = useSelector(selectIsSystemOnline);
  const connectionError = useSelector(selectConnectionError);
  const pendingCount = useSelector((state) => state.order.pendingOrderCount);

  // Service controls belong to whoever runs a service. A platform admin has no
  // restaurant, no kitchen and no realtime channel, so pausing "orders" would
  // be pausing nothing — the control was meaningless on their screen.
  const showsServiceControls = !isSuperAdmin;

  useOrderChime(pendingCount ?? 0, showsServiceControls);

  const toggleSystem = () => {
    const next = !isSystemOnline;
    dispatch(setSystemOnline(next));
    toast({
      title: next ? "Taking orders" : "Orders paused",
      description: next
        ? "New orders will appear on the board."
        : "The kitchen board won't receive new orders until you resume.",
      variant: next ? "success" : "warning",
    });
  };

  return (
    <header
      data-app-header
      className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70"
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenNav}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0">
        {title && (
          <h1 className="truncate text-base font-semibold tracking-tight">{title}</h1>
        )}
        {!title && hotelName && (
          <p className="truncate text-sm font-medium text-muted-foreground">
            {hotelName}
          </p>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        {showsServiceControls && (
          /**
           * One control, not two.
           *
           * There used to be a "Live" pill beside a "Taking orders" button.
           * "Live" only ever described the websocket, so it read the same
           * whether the kitchen was accepting orders or shut — two badges
           * saying different things about different subjects, one word apart.
           * Connection state is now a dot *inside* the service button, where
           * it qualifies the claim the button is making instead of competing
           * with it.
           */
          <Button
            variant={isSystemOnline ? "outline" : "destructive"}
            size="sm"
            onClick={toggleSystem}
            className="gap-2"
            title={
              connectionError
                ? `Reconnecting — ${connectionError}`
                : isSystemOnline
                  ? "Accepting new orders. Click to pause."
                  : "Paused. Click to start accepting orders."
            }
          >
            <span className="relative flex h-2 w-2" aria-hidden="true">
              {isSystemOnline && !connectionError && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-70" />
              )}
              <span
                className={cn(
                  "relative inline-flex h-2 w-2 rounded-full",
                  connectionError
                    ? "bg-destructive"
                    : isSystemOnline
                      ? "bg-success"
                      : "bg-muted-foreground"
                )}
              />
            </span>

            <span className="hidden sm:inline">
              {connectionError
                ? "Reconnecting"
                : isSystemOnline
                  ? "Taking orders"
                  : "Paused"}
            </span>

            {/* Screen readers get the connection state in words, since the
                dot carries it visually. */}
            <span className="sr-only">
              {connectionError
                ? "Live updates disconnected"
                : "Live updates connected"}
            </span>
          </Button>
        )}

        {/* Appearance: one button, both directions. It sat in the account
            menu, three items deep, which made a setting people flip daily
            harder to reach than signing out. */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}
          title={resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          aria-label={
            resolved === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" aria-hidden="true" />
          <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" aria-hidden="true" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2 pl-1.5 pr-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-2xs font-bold text-primary-foreground">
                {initials(user?.name)}
              </span>
              <span className="hidden max-w-[9rem] truncate text-sm font-medium md:inline">
                {user?.name ?? "Account"}
              </span>
              <ChevronDown
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden="true"
              />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
              {role && (
                <span className="mt-1.5 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-semibold text-primary">
                  {ROLE_LABELS[role] ?? role}
                </span>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">
                <UserRoundCog className="mr-2 h-4 w-4" aria-hidden="true" />
                Profile &amp; settings
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => handleLogout()}
              disabled={loggingOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              {loggingOut ? "Signing out…" : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

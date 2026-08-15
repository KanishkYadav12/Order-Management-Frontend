"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A single headline figure.
 *
 * Deliberately not a chart: a KPI's job is to be read at a glance, and a
 * sparkline behind a number usually costs legibility without adding
 * information the reader can act on. The delta is shown with an arrow and a
 * sign as well as colour.
 */
export function StatCard({
  label,
  value,
  hint,
  delta,
  Icon,
  tone = "default",
  loading = false,
  className,
}) {
  const TONES = {
    default: "text-foreground",
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  const direction =
    delta === undefined || delta === null
      ? null
      : delta > 0
        ? "up"
        : delta < 0
          ? "down"
          : "flat";

  const DeltaIcon =
    direction === "up"
      ? ArrowUpRight
      : direction === "down"
        ? ArrowDownRight
        : Minus;

  if (loading) {
    return (
      <div className={cn("rounded-xl border bg-card p-4", className)}>
        <div className="shimmer h-3 w-20 rounded" />
        <div className="shimmer mt-3 h-8 w-28 rounded" />
        <div className="shimmer mt-3 h-3 w-16 rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <Icon
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        )}
      </div>

      <p
        className={cn(
          "mt-2 text-3xl font-bold tabular tracking-tight",
          TONES[tone]
        )}
      >
        {value}
      </p>

      <div className="mt-1.5 flex items-center gap-2">
        {direction && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-semibold tabular",
              direction === "up" && "text-success",
              direction === "down" && "text-destructive",
              direction === "flat" && "text-muted-foreground"
            )}
          >
            <DeltaIcon className="h-3 w-3" aria-hidden="true" />
            {direction === "up" ? "+" : ""}
            {delta}%
          </span>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

export default StatCard;

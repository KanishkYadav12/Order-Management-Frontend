"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, Inbox, RefreshCw } from "lucide-react";

/**
 * The "nothing here yet" state.
 *
 * Most screens previously rendered a bare empty grid, which is
 * indistinguishable from a screen that failed to load. An empty state should
 * say what is missing and offer the action that fills it.
 */
export function EmptyState({
  Icon = Inbox,
  title,
  description,
  action,
  actionLabel,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 px-6 py-14 text-center",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      )}
      {action && actionLabel && (
        <Button onClick={action} className="mt-5" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

/**
 * The failure counterpart. Always offers a retry — an error the user can only
 * read is a dead end.
 */
export function ErrorState({ title = "That didn't load", description, onRetry, className }) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-destructive/25 bg-destructive/5 px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground text-pretty">
          {description}
        </p>
      )}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-5 gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  );
}

export default EmptyState;

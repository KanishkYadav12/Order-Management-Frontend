"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * The "about this dish" panel diners read on the QR menu, managed by the owner.
 *
 * Two things this deliberately does not do:
 *
 *   · It never publishes on generation. The text can carry nutritional claims
 *     about food being sold to the public, and that risk sits with the
 *     restaurant, not the model — so a person reads it first.
 *   · It never regenerates on its own. Every write-up is stored, and a diner
 *     tapping a dish reads the stored copy. Generation is an owner action.
 */
export default function DishFactsPanel({ dishId }) {
  const [facts, setFacts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!dishId) return;
    let cancelled = false;

    // A plain read: the server only generates when nothing valid is stored,
    // so opening this page cannot silently spend the AI quota.
    api
      .post(`/ai/dish-facts/${dishId}`)
      .then(({ data }) => {
        if (!cancelled) setFacts(data?.data?.facts ?? null);
      })
      .catch(() => {
        if (!cancelled) setFacts(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dishId]);

  const generate = async (force) => {
    setWorking(true);
    try {
      const { data } = await api.post(
        `/ai/dish-facts/${dishId}${force ? "?force=true" : ""}`
      );
      setFacts(data?.data?.facts ?? null);
      toast({
        title: data?.data?.cached ? "Loaded the saved write-up" : "Write-up ready",
        description: data?.data?.cached
          ? undefined
          : "Read it over, then publish it to your menu.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't write that up",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  const setApproval = async (approved) => {
    setWorking(true);
    try {
      const { data } = await api.patch(`/ai/dish-facts/${dishId}/approval`, {
        approved,
      });
      setFacts(data?.data?.facts ?? null);
      toast({
        title: approved ? "Live on your menu" : "Hidden from the menu",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't update that",
        description: getErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <div className="shimmer h-40 rounded-xl" />;

  const hasFacts = Boolean(facts?.summary);

  return (
    <section className="rounded-xl border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            Menu write-up
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            What a diner reads about this dish before ordering.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {hasFacts && (
            <Button
              variant="outline"
              size="sm"
              disabled={working}
              onClick={() => generate(true)}
              className="gap-1.5"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", working && "animate-spin")}
                aria-hidden="true"
              />
              Rewrite
            </Button>
          )}

          {hasFacts ? (
            <Button
              size="sm"
              variant={facts.approved ? "outline" : "default"}
              disabled={working}
              onClick={() => setApproval(!facts.approved)}
              className="gap-1.5"
            >
              {facts.approved ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                  Publish
                </>
              )}
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={working}
              onClick={() => generate(false)}
              className="gap-1.5"
            >
              {working ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              Write it for me
            </Button>
          )}
        </div>
      </div>

      {!hasFacts ? (
        <p className="mt-3 text-sm text-muted-foreground text-pretty">
          Nothing written yet. Generate one and it&apos;s saved — every diner who
          taps this dish afterwards reads the same copy, instantly.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-semibold",
              facts.approved
                ? "border-success/35 bg-success/10 text-success"
                : "border-status-pending/35 bg-status-pending/10 text-status-pending"
            )}
          >
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {facts.approved ? "Live on the menu" : "Draft — not shown to diners"}
          </span>

          <p className="text-sm leading-relaxed text-pretty">{facts.summary}</p>

          {facts.highlights?.length > 0 && (
            <ul className="space-y-1">
              {facts.highlights.map((line, index) => (
                <li key={index} className="flex gap-2 text-sm">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {line}
                </li>
              ))}
            </ul>
          )}

          {facts.goodToKnow && (
            <p className="flex gap-2 rounded-lg bg-muted/60 p-2.5 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {facts.goodToKnow}
            </p>
          )}

          {facts.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {facts.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="text-2xs text-muted-foreground">
            Written by AI — check it before publishing. Editing the dish&apos;s
            name or ingredients retires this copy automatically.
          </p>
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  Send,
  Sparkles,
  Plus,
  Trash2,
  MessageSquare,
  Wrench,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAdvisor } from "@/hooks/ai/useAdvisor";
import { cn } from "@/lib/utils";

/** Openers that show what the advisor is actually for. */
const STARTERS = [
  "How are sales today compared to normal?",
  "Give me suggestions for tomorrow — what should I prepare and how should I set up?",
  "Which dishes should I drop from the menu?",
  "What combo should I run this weekend, and at what price?",
];

const TOOL_LABELS = {
  getMenuPerformance: "menu profitability",
  getForecast: "demand forecast",
  getPrepPlan: "prep plan",
  getDishPairings: "dish pairings",
  getUnusualDays: "unusual days",
  getSalesForPeriod: "sales figures",
};

/**
 * Renders the model's markdown-ish output.
 *
 * Deliberately tiny: the reply is prose with the occasional heading, bullet
 * and bold run. Pulling in a full markdown pipeline for that would be more
 * dependency than the job needs.
 */
function Answer({ text }) {
  const blocks = String(text ?? "").split(/\n{2,}/);

  const inline = (line) =>
    line.split(/(\*\*[^*]+\*\*)/g).map((piece, index) =>
      piece.startsWith("**") && piece.endsWith("**") ? (
        <strong key={index}>{piece.slice(2, -2)}</strong>
      ) : (
        <span key={index}>{piece}</span>
      )
    );

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, index) => {
        const lines = block.split("\n").filter(Boolean);

        if (block.startsWith("###")) {
          return (
            <h4 key={index} className="pt-1 text-sm font-semibold">
              {block.replace(/^#+\s*/, "")}
            </h4>
          );
        }

        if (lines.every((line) => /^\s*[*-]\s+/.test(line))) {
          return (
            <ul key={index} className="ml-4 list-disc space-y-1">
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*[*-]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-pretty">
            {inline(block)}
          </p>
        );
      })}
    </div>
  );
}

export default function AdvisorChat({ enabled }) {
  const {
    turns,
    thinking,
    error,
    conversations,
    send,
    startNew,
    openConversation,
    removeConversation,
    conversationId,
  } = useAdvisor();

  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, thinking]);

  const submit = (event) => {
    event?.preventDefault();
    if (!draft.trim() || thinking) return;
    send(draft);
    setDraft("");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
      {/* Past conversations */}
      <aside className="order-2 space-y-2 lg:order-1">
        <Button onClick={startNew} variant="outline" size="sm" className="w-full gap-1.5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New chat
        </Button>

        {conversations.length > 0 && (
          <ul className="space-y-1">
            {conversations.map((item) => (
              <li key={item._id} className="group/row relative">
                <button
                  type="button"
                  onClick={() => openConversation(item._id)}
                  className={cn(
                    "w-full truncate rounded-lg px-2.5 py-2 pr-8 text-left text-xs transition-colors",
                    item._id === conversationId
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <MessageSquare
                    className="mr-1.5 inline h-3 w-3 align-[-1px]"
                    aria-hidden="true"
                  />
                  {item.title}
                </button>
                <button
                  type="button"
                  onClick={() => removeConversation(item._id)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover/row:opacity-100"
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="h-3 w-3" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      {/* The conversation */}
      <div className="order-1 flex min-h-[30rem] flex-col rounded-xl border bg-card lg:order-2">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {turns.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-base font-semibold">
                Ask about your restaurant
              </h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground text-pretty">
                I know your menu, your takings, which nights are busy and what&apos;s
                low on stock — plus today&apos;s date, the festival calendar and
                what&apos;s in the local news.
              </p>

              <div className="mt-5 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    disabled={!enabled}
                    onClick={() => send(starter)}
                    className="rounded-lg border p-2.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {turns.map((turn, index) =>
            turn.role === "user" ? (
              <div key={index} className="flex justify-end">
                <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground text-pretty">
                  {turn.text}
                </p>
              </div>
            ) : (
              <div key={index} className="flex gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <Answer text={turn.text} />

                  {/* Which reports produced this. The owner is acting on these
                      numbers, so where they came from is not a detail. */}
                  {turn.toolsUsed?.length > 0 && (
                    <p className="mt-2 flex flex-wrap items-center gap-1 text-2xs text-muted-foreground">
                      <Wrench className="h-3 w-3" aria-hidden="true" />
                      checked{" "}
                      {[...new Set(turn.toolsUsed)]
                        .map((tool) => TOOL_LABELS[tool] ?? tool)
                        .join(", ")}
                    </p>
                  )}
                </div>
              </div>
            )
          )}

          {thinking && (
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Loader2
                  className="h-3.5 w-3.5 animate-spin text-primary"
                  aria-hidden="true"
                />
              </span>
              <p className="pt-1 text-sm text-muted-foreground">
                Checking your figures…
              </p>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              {error}
            </div>
          )}

          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="border-t p-3">
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter sends; Shift+Enter is a newline.
                if (event.key === "Enter" && !event.shiftKey) submit(event);
              }}
              placeholder={
                enabled
                  ? "Ask anything about your restaurant…"
                  : "Set AI_PROVIDER and AI_API_KEY to enable the chat"
              }
              disabled={!enabled || thinking}
              rows={1}
              className="max-h-32 min-h-[2.5rem] resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!enabled || thinking || !draft.trim()}
              aria-label="Send"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <p className="mt-1.5 text-2xs text-muted-foreground">
            Figures come from your own records. Advice is a suggestion — a
            detailed answer can take up to a minute.
          </p>
        </form>
      </div>
    </div>
  );
}

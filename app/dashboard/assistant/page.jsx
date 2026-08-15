"use client";

import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Trash2,
  ChevronDown,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { useAssistant, useAiStatus, useReport } from "@/hooks/ai/useAssistant";
import { formatMoney, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "Which dishes should I take off the menu?",
  "How busy will this weekend be?",
  "What should I prep for tomorrow?",
  "Which dishes sell together?",
  "Was anything unusual last month?",
];

/** Colour and copy per menu-engineering class. Never colour alone. */
const CLASSES = {
  star: { label: "Star", tone: "text-success bg-success/10 border-success/30" },
  plowhorse: {
    label: "Sells well, earns little",
    tone: "text-warning bg-warning/10 border-warning/30",
  },
  puzzle: {
    label: "Profitable, overlooked",
    tone: "text-info bg-info/10 border-info/30",
  },
  dog: {
    label: "Weak on both",
    tone: "text-destructive bg-destructive/10 border-destructive/30",
  },
};

function MenuBoard() {
  const { data, error, loading, refetch } = useReport("menu-analysis");

  if (error) return <ErrorState description={error} onRetry={refetch} />;
  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="shimmer h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data?.items?.length) {
    return (
      <EmptyState
        title="No sales to analyse yet"
        description="Once you've settled some bills, every dish gets scored on how well it sells and how much it earns."
      />
    );
  }

  const { summary, recommendations } = data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { key: "star", count: summary.stars },
          { key: "plowhorse", count: summary.plowhorses },
          { key: "puzzle", count: summary.puzzles },
          { key: "dog", count: summary.dogs },
        ].map(({ key, count }) => (
          <div
            key={key}
            className={cn("rounded-xl border p-4", CLASSES[key].tone)}
          >
            <p className="text-3xl font-bold tabular">{count}</p>
            <p className="mt-1 text-xs font-semibold">{CLASSES[key].label}</p>
          </div>
        ))}
      </div>

      {summary.unpricedRecipes > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden="true" />
          <span>
            {summary.unpricedRecipes} dishes have no recipe costed, so their
            margin is estimated at 30%. Add ingredient costs for real figures.
          </span>
        </p>
      )}

      {recommendations?.length > 0 && (
        <section className="rounded-xl border bg-card">
          <header className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold">What to do next</h3>
          </header>
          <ul className="divide-y">
            {recommendations.map((rec, index) => (
              <li key={index} className="flex gap-3 px-4 py-3">
                <span
                  className={cn(
                    "mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wide",
                    rec.type === "remove" && "bg-destructive/10 text-destructive",
                    rec.type === "reprice" && "bg-warning/10 text-warning",
                    rec.type === "promote" && "bg-info/10 text-info"
                  )}
                >
                  {rec.type}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{rec.dish}</p>
                  <p className="text-xs text-muted-foreground">{rec.reason}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border bg-card">
        <header className="border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Every dish</h3>
        </header>
        <div className="scroll-x">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-2xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-semibold">Dish</th>
                <th className="px-4 py-2 font-semibold">Verdict</th>
                <th className="px-4 py-2 text-right font-semibold">Sold</th>
                <th className="px-4 py-2 text-right font-semibold">Margin each</th>
                <th className="px-4 py-2 text-right font-semibold">Total earned</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.items.slice(0, 30).map((item) => (
                <tr key={item.dishId}>
                  <td className="px-4 py-2.5 font-medium">{item.name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "inline-block rounded-full border px-2 py-0.5 text-2xs font-semibold",
                        CLASSES[item.classification].tone
                      )}
                    >
                      {CLASSES[item.classification].label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular">{item.units}</td>
                  <td className="px-4 py-2.5 text-right tabular">
                    {formatMoney(item.marginPerUnit)}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular">
                    {formatMoney(item.totalMargin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ForecastBoard() {
  const { data, error, loading, refetch } = useReport("forecast", { days: 7 });

  if (error) return <ErrorState description={error} onRetry={refetch} />;
  if (loading) return <div className="shimmer h-52 rounded-xl" />;

  if (!data?.ready) {
    return <EmptyState title="Not enough history yet" description={data?.reason} />;
  }

  const peak = Math.max(...data.forecast.map((d) => d.coversRange.high), 1);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-success/30 bg-success/10 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> Busiest
          </p>
          <p className="mt-1 text-lg font-bold">{data.busiestDay.weekday}</p>
          <p className="text-sm text-muted-foreground tabular">
            ~{data.busiestDay.expectedCovers} covers
          </p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" /> Quietest
          </p>
          <p className="mt-1 text-lg font-bold">{data.quietestDay.weekday}</p>
          <p className="text-sm text-muted-foreground tabular">
            ~{data.quietestDay.expectedCovers} covers
          </p>
        </div>
      </div>

      <section className="rounded-xl border bg-card">
        <ul className="divide-y">
          {data.forecast.map((day) => (
            <li key={day.date} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{day.weekday}</p>
                  <p className="text-xs text-muted-foreground">{day.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular">
                    {day.expectedCovers} covers
                  </p>
                  <p className="text-xs text-muted-foreground tabular">
                    {day.coversRange.low}–{day.coversRange.high} ·{" "}
                    {formatMoney(day.expectedRevenue)}
                  </p>
                </div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-chart-1"
                  style={{ width: `${(day.expectedCovers / peak) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-2xs text-muted-foreground">
                {day.confidence} confidence · {day.basedOnSamples} past{" "}
                {day.weekday}s
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PairingsBoard() {
  const { data, error, loading, refetch } = useReport("pairings");

  if (error) return <ErrorState description={error} onRetry={refetch} />;
  if (loading) return <div className="shimmer h-52 rounded-xl" />;
  if (!data?.ready) {
    return <EmptyState title="Not enough bills yet" description={data?.reason} />;
  }
  if (data.pairs.length === 0) {
    return (
      <EmptyState
        title="No strong pairings found"
        description="Nothing yet appears together more often than chance would explain."
      />
    );
  }

  return (
    <section className="rounded-xl border bg-card">
      <header className="border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Ordered together</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">
          From {formatNumber(data.billsAnalysed)} settled bills. Use these for
          combos and staff prompts.
        </p>
      </header>
      <ul className="divide-y">
        {data.pairs.slice(0, 12).map((pair, index) => (
          <li key={index} className="flex items-center gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {pair.a.name}{" "}
                <span className="text-muted-foreground">+</span> {pair.b.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {pair.confidenceAtoB}% of {pair.a.name} orders also include{" "}
                {pair.b.name}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-2xs font-semibold tabular">
              {pair.together}× together
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Chat({ enabled, provider }) {
  const { messages, pending, send, reset } = useAssistant();
  const [draft, setDraft] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  const submit = (event) => {
    event.preventDefault();
    send(draft);
    setDraft("");
  };

  return (
    <div className="flex h-[32rem] flex-col rounded-xl border bg-card">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Ask about your restaurant</h3>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Clear
          </Button>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto p-4 custom-scrollbar">
        {messages.length === 0 && (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
            </span>
            <p className="mt-3 text-sm text-muted-foreground">
              {enabled
                ? "Ask anything about your sales, menu or kitchen."
                : "Answers come back as data until you connect a free AI provider."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="flex justify-start">
              <div className="max-w-[92%] space-y-2">
                {message.error ? (
                  <p className="rounded-2xl rounded-bl-sm border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-sm text-destructive">
                    {message.error}
                  </p>
                ) : (
                  <>
                    {message.text ? (
                      <p className="whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm">
                        {message.text}
                      </p>
                    ) : (
                      <p className="rounded-2xl rounded-bl-sm bg-muted px-3.5 py-2 text-sm text-muted-foreground">
                        {message.note ??
                          "Here's the report — connect a provider for a written answer."}
                      </p>
                    )}

                    {/* The figures behind the answer, so it can be checked. */}
                    {message.data && (
                      <details className="rounded-lg border bg-background">
                        <summary className="flex cursor-pointer items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-3 w-3" aria-hidden="true" />
                          Figures behind this ({message.report})
                        </summary>
                        <pre className="scroll-x max-h-56 border-t p-3 text-2xs leading-relaxed text-muted-foreground">
                          {JSON.stringify(message.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        )}

        {pending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            Working through your numbers…
          </p>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex gap-2 border-t p-3">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="e.g. which dishes lose me money?"
          maxLength={500}
          disabled={pending}
          aria-label="Your question"
        />
        <Button type="submit" size="icon" disabled={pending || !draft.trim()}>
          <Send className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}

const TABS = [
  { id: "chat", label: "Ask" },
  { id: "menu", label: "Menu profit" },
  { id: "forecast", label: "Forecast" },
  { id: "pairings", label: "Pairings" },
];

export default function AssistantPage() {
  const [tab, setTab] = useState("chat");
  const { status, loading } = useAiStatus();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
          Insights
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Everything here is calculated from your own sales — no guesswork.
        </p>
      </div>

      {!loading && status && !status.enabled && (
        <div className="flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/10 p-3.5">
          <HelpCircle
            className="mt-0.5 h-4 w-4 shrink-0 text-info"
            aria-hidden="true"
          />
          <div className="text-sm">
            <p className="font-medium">
              Reports work. Written answers need a provider.
            </p>
            <p className="mt-0.5 text-muted-foreground">
              Menu profit, forecasting and pairings are pure statistics and run
              as-is. To get answers in plain English, set{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                AI_PROVIDER
              </code>{" "}
              to a free option — Google Gemini, Groq, or Ollama on your own
              machine.
            </p>
          </div>
        </div>
      )}

      <div
        role="tablist"
        aria-label="Insight sections"
        className="inline-flex flex-wrap rounded-lg border bg-muted/50 p-0.5"
      >
        {TABS.map((option) => (
          <button
            key={option.id}
            role="tab"
            aria-selected={tab === option.id}
            onClick={() => setTab(option.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === option.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {tab === "chat" && (
        <Chat enabled={status?.enabled} provider={status?.provider} />
      )}
      {tab === "menu" && <MenuBoard />}
      {tab === "forecast" && <ForecastBoard />}
      {tab === "pairings" && <PairingsBoard />}
    </div>
  );
}

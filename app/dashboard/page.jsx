"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  IndianRupee,
  Receipt,
  TrendingUp,
  TrendingDown,
  Timer,
  PackageX,
  ArrowRight,
  CookingPot,
  BellRing,
  Flame,
  Armchair,
  Wallet,
  Minus,
  Plus,
} from "lucide-react";
import { useFetchDashboard } from "@/hooks/dashboard/useFetchDashboard";
import { useAuth } from "@/hooks/auth/useAuth";
import { ErrorState } from "@/components/ui/empty-state";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Button } from "@/components/ui/button";
import NewOrderDialog from "@/components/orders/NewOrderDialog";
import { cn } from "@/lib/utils";
import {
  formatMoneyShort,
  formatMoney,
  formatNumber,
  percentChange,
} from "@/lib/format";

const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
];

const PAYMENT_LABEL = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  wallet: "Wallet",
  other: "Other",
};

/**
 * A headline figure.
 *
 * The delta carries an arrow and a sign as well as colour, so the direction
 * survives a colour-blind reader and a glare-washed screen.
 */
function Stat({ label, value, hint, delta, Icon, accent = false, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-4">
        <div className="shimmer h-3 w-20 rounded" />
        <div className="shimmer mt-3 h-8 w-28 rounded" />
        <div className="shimmer mt-3 h-3 w-16 rounded" />
      </div>
    );
  }

  const direction =
    delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  const DeltaIcon =
    direction === "up" ? TrendingUp : direction === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-shadow hover:shadow-sm",
        accent ? "border-primary/25 bg-primary/[0.06]" : "bg-card"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            accent ? "text-primary" : "text-muted-foreground"
          )}
          aria-hidden="true"
        />
      </div>

      <p
        className={cn(
          "mt-2 text-3xl font-bold tabular tracking-tight",
          accent && "text-primary"
        )}
      >
        {value}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
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

/** One live kitchen figure. Three of these read faster than a sentence. */
function KitchenTile({ label, count, Icon, tone }) {
  return (
    <div className={cn("flex items-center gap-2.5 rounded-lg border p-2.5", tone)}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="text-lg font-bold tabular">{count}</span>
      <span className="truncate text-xs font-medium">{label}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [rangeId, setRangeId] = useState("30d");
  const [composing, setComposing] = useState(false);
  const { user, hotelName } = useAuth();

  const range = useMemo(() => {
    const days = RANGES.find((r) => r.id === rangeId)?.days ?? 30;
    const from = new Date();
    from.setDate(from.getDate() - days);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: new Date().toISOString() };
  }, [rangeId]);

  const { data, loading, error, refetch } = useFetchDashboard(range);

  /** Latest day against the one before — a read, not another request. */
  const dayOverDay = useMemo(() => {
    const series = data?.series ?? [];
    if (series.length < 2) return null;
    const [previous, latest] = series.slice(-2);
    return percentChange(latest.revenue, previous.revenue);
  }, [data]);

  if (error) {
    return (
      <ErrorState
        title="Couldn't load your dashboard"
        description={error}
        onRetry={refetch}
      />
    );
  }

  const revenue = data?.revenue ?? {};
  const customers = data?.customers ?? {};
  const kitchen = data?.kitchen ?? {};
  const tables = data?.tables ?? {};
  const topDishes = data?.topDishes ?? [];
  const paymentMix = data?.paymentMix ?? [];
  const lowStock = data?.alerts?.lowStockIngredients ?? 0;

  const liveOrders =
    (kitchen.pending ?? 0) + (kitchen.preparing ?? 0) + (kitchen.ready ?? 0);
  const paymentTotal = paymentMix.reduce((sum, row) => sum + row.amount, 0) || 1;
  const ordersHref = user?.hotelId ? `/order-page/${user.hotelId}` : "/order-page";

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {greeting}
            {user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {hotelName ?? "Your restaurant"}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Date range"
          className="inline-flex rounded-lg border bg-muted/50 p-0.5"
        >
          {RANGES.map((option) => (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={rangeId === option.id}
              onClick={() => setRangeId(option.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                rangeId === option.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* What's happening right now, before any history */}
      <section className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Right now</h2>
            {liveOrders > 0 && (
              <span className="flex h-2 w-2 rounded-full bg-success" aria-hidden="true">
                <span className="h-2 w-2 animate-ping rounded-full bg-success/70" />
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {/* Taking an order is the most frequent thing anyone does here, so
                it belongs on the first screen rather than two clicks away. */}
            <Button size="sm" className="h-8 gap-1.5" onClick={() => setComposing(true)}>
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              New order
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
              <Link href={ordersHref}>
                Open kitchen board
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>

        <NewOrderDialog open={composing} onOpenChange={setComposing} />

        {loading ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="shimmer h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <KitchenTile
              label="waiting"
              count={kitchen.pending ?? 0}
              Icon={CookingPot}
              tone={
                (kitchen.pending ?? 0) > 0
                  ? "border-status-pending/30 bg-status-pending/10 text-status-pending"
                  : "text-muted-foreground"
              }
            />
            <KitchenTile
              label="cooking"
              count={kitchen.preparing ?? 0}
              Icon={Flame}
              tone={
                (kitchen.preparing ?? 0) > 0
                  ? "border-status-preparing/30 bg-status-preparing/10 text-status-preparing"
                  : "text-muted-foreground"
              }
            />
            <KitchenTile
              label="ready to serve"
              count={kitchen.ready ?? 0}
              Icon={BellRing}
              tone={
                (kitchen.ready ?? 0) > 0
                  ? "border-status-ready/30 bg-status-ready/10 text-status-ready"
                  : "text-muted-foreground"
              }
            />
            <KitchenTile
              label={`of ${tables.total ?? 0} tables seated`}
              count={tables.occupied ?? 0}
              Icon={Armchair}
              tone={
                (tables.occupied ?? 0) > 0
                  ? "border-table-occupied/30 bg-table-occupied/10 text-table-occupied"
                  : "text-muted-foreground"
              }
            />
          </div>
        )}
      </section>

      {/* Headline numbers */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Revenue today"
          value={formatMoneyShort(revenue.today)}
          delta={dayOverDay}
          hint="vs yesterday"
          Icon={IndianRupee}
          accent
          loading={loading}
        />
        <Stat
          label="Bills today"
          value={formatNumber(customers.today)}
          hint={`${formatNumber(customers.monthly)} this period`}
          Icon={Receipt}
          loading={loading}
        />
        <Stat
          label="Average ticket"
          value={formatMoneyShort(revenue.averageTicket)}
          hint="per settled bill"
          Icon={Wallet}
          loading={loading}
        />
        <Stat
          label="Avg prep time"
          value={kitchen.averagePrepMinutes ? `${kitchen.averagePrepMinutes}m` : "—"}
          hint="order to ready"
          Icon={Timer}
          loading={loading}
        />
      </div>

      {/* Anything needing a decision */}
      {lowStock > 0 && !loading && (
        <Link
          href="/dashboard/configuration/ingredients"
          className="group flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 transition-colors hover:bg-warning/15"
        >
          <PackageX className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">
              {lowStock} ingredient{lowStock === 1 ? "" : "s"} running low
            </span>
            <span className="text-muted-foreground"> · restock before service</span>
          </p>
          <ArrowRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      )}

      <RevenueChart series={data?.series ?? []} loading={loading} />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Best sellers */}
        <section className="rounded-xl border bg-card lg:col-span-2">
          <header className="flex items-baseline justify-between border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Best sellers</h2>
            <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              This period
            </span>
          </header>

          {loading ? (
            <div className="space-y-2 p-4">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="shimmer h-10 rounded-lg" />
              ))}
            </div>
          ) : topDishes.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No sales in this period yet.
            </p>
          ) : (
            <ol className="divide-y">
              {topDishes.slice(0, 6).map((dish, index) => {
                const share = (dish.totalQuantity / topDishes[0].totalQuantity) * 100;
                return (
                  <li
                    key={dish.id ?? index}
                    className="relative flex items-center gap-3 px-4 py-2.5"
                  >
                    {/* A bar behind the row, so relative popularity is
                        readable without a separate chart. */}
                    <span
                      className="absolute inset-y-0 left-0 bg-primary/[0.07]"
                      style={{ width: `${share}%` }}
                      aria-hidden="true"
                    />
                    <span className="relative w-4 shrink-0 text-center text-xs font-bold tabular text-muted-foreground">
                      {index + 1}
                    </span>
                    <p className="relative min-w-0 flex-1 truncate text-sm font-medium">
                      {dish.name}
                    </p>
                    <span className="relative shrink-0 text-xs tabular text-muted-foreground">
                      {formatNumber(dish.totalQuantity)} sold
                    </span>
                    <span className="relative w-20 shrink-0 text-right text-sm font-semibold tabular">
                      {formatMoney(dish.totalRevenue)}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* How people paid */}
        <section className="rounded-xl border bg-card">
          <header className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">How people paid</h2>
          </header>
          <div className="space-y-3 p-4">
            {loading ? (
              [0, 1, 2].map((i) => <div key={i} className="shimmer h-9 rounded-lg" />)
            ) : paymentMix.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              paymentMix.map((row, index) => {
                const share = Math.round((row.amount / paymentTotal) * 100);
                return (
                  <div key={row._id}>
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium">
                        {PAYMENT_LABEL[row._id] ?? row._id}
                      </span>
                      <span className="tabular text-muted-foreground">
                        {formatMoney(row.amount)}
                        <span className="ml-1.5 font-semibold text-foreground">
                          {share}%
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          ["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][
                            index % 5
                          ]
                        )}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

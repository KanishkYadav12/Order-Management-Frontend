"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Clock,
  Flame,
  BellRing,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Receipt,
  Loader2,
  UtensilsCrossed,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { useGetAllOrders } from "@/hooks/order/useGetAllOrders";
import { updateOrderStatus } from "@/redux/actions/order/orderActions";
import { useAuth } from "@/hooks/auth/useAuth";
import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { formatMoney, minutesSince } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * The kitchen board.
 *
 * Read across a room on a wall-mounted tablet, so it optimises for glanceable
 * state over density: each column owns a colour and an icon, the age of an
 * order is always visible, and anything waiting too long escalates on its own.
 * One tap moves a ticket forward — that is the action the board exists for, so
 * it is the largest target on the card.
 */

const COLUMNS = [
  {
    key: "pending",
    label: "New",
    Icon: Clock,
    tone: "status-pending",
    next: "preparing",
    nextLabel: "Start cooking",
    // Minutes before a ticket in this column starts asking for attention.
    warnAfter: 5,
  },
  {
    key: "preparing",
    label: "Cooking",
    Icon: Flame,
    tone: "status-preparing",
    next: "ready",
    nextLabel: "Mark ready",
    warnAfter: 20,
  },
  {
    key: "ready",
    label: "Ready to serve",
    Icon: BellRing,
    tone: "status-ready",
    next: "completed",
    nextLabel: "Served",
    warnAfter: 5,
  },
  {
    key: "completed",
    label: "Served",
    Icon: CheckCircle2,
    tone: "status-completed",
    next: null,
    warnAfter: null,
  },
];

/* Explicit class strings — Tailwind cannot see a template-built class name. */
const TONE = {
  "status-pending": {
    bar: "bg-status-pending",
    soft: "bg-status-pending/10 text-status-pending border-status-pending/30",
    ring: "ring-status-pending/30",
  },
  "status-preparing": {
    bar: "bg-status-preparing",
    soft: "bg-status-preparing/10 text-status-preparing border-status-preparing/30",
    ring: "ring-status-preparing/30",
  },
  "status-ready": {
    bar: "bg-status-ready",
    soft: "bg-status-ready/10 text-status-ready border-status-ready/30",
    ring: "ring-status-ready/30",
  },
  "status-completed": {
    bar: "bg-status-completed",
    soft: "bg-status-completed/10 text-status-completed border-status-completed/30",
    ring: "ring-status-completed/30",
  },
};

const orderTotal = (order) =>
  (order.dishes ?? []).reduce(
    (sum, item) =>
      sum + (item.unitPrice ?? item.dishId?.price ?? 0) * (item.quantity ?? 0),
    0
  );

/** Re-renders on a timer so "8 min ago" stays true without a refetch. */
const useTicker = (ms = 30_000) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
};

function TicketCard({ order, column, onAdvance, onRegress, onBill, busy, billing }) {
  const placedAt = order.confirmedAt ?? order.createdAt;
  const age = minutesSince(placedAt);
  const overdue = column.warnAfter != null && age >= column.warnAfter;
  const tone = TONE[column.tone];

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md",
        overdue && "ring-2",
        overdue && tone.ring
      )}
    >
      <span className={cn("absolute inset-x-0 top-0 h-1", tone.bar)} aria-hidden="true" />

      <div className="flex items-start gap-3 border-b p-3 pt-4">
        <span className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-center leading-none">
          <span className="text-[9px] font-semibold uppercase text-muted-foreground">
            Table
          </span>
          <span className="text-base font-bold tabular">
            {order.tableId?.sequence ?? "—"}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {order.customerId?.name ?? "Guest"}
          </p>
          <p
            className={cn(
              "flex items-center gap-1 text-xs tabular",
              overdue ? "font-semibold text-warning" : "text-muted-foreground"
            )}
          >
            {overdue && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
            {age < 1 ? "just now" : `${age} min`}
            {overdue && " waiting"}
          </p>
        </div>

        <span className="shrink-0 text-sm font-bold tabular">
          {formatMoney(orderTotal(order))}
        </span>
      </div>

      <ul className="divide-y">
        {(order.dishes ?? []).map((item, index) => (
          <li
            key={`${item.dishId?._id ?? index}`}
            className="flex items-start gap-2 px-3 py-2"
          >
            <span className="mt-0.5 min-w-[1.75rem] shrink-0 rounded bg-muted px-1 text-center text-xs font-bold tabular">
              {item.quantity}×
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">
                {item.dishId?.name ?? "Item"}
              </p>
              {item.note && (
                // A kitchen note is the whole reason a ticket goes wrong when
                // missed, so it gets colour rather than muted small print.
                <p className="mt-0.5 text-xs font-medium text-warning">
                  {item.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>

      {order.note && (
        <p className="border-t bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
          {order.note}
        </p>
      )}

      <div className="flex items-center gap-2 border-t p-2">
        {onRegress && (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            disabled={busy}
            onClick={() => onRegress(order)}
            aria-label="Move back a step"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}

        {column.next ? (
          <Button
            className="h-9 flex-1 gap-1.5"
            disabled={busy}
            onClick={() => onAdvance(order)}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
            {column.nextLabel}
          </Button>
        ) : (
          // Once a ticket is served, the only thing left to do with it is take
          // the money — so that action lives on the ticket rather than in a
          // separate panel the waiter has to cross-reference by table number.
          <Button
            className="h-9 flex-1 gap-1.5"
            variant="secondary"
            disabled={billing}
            onClick={() => onBill?.(order)}
          >
            {billing ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Receipt className="h-4 w-4" aria-hidden="true" />
            )}
            Generate bill
          </Button>
        )}
      </div>
    </article>
  );
}

function Column({ column, orders, onAdvance, onRegress, onBill, busyId, billingTable }) {
  const tone = TONE[column.tone];
  const value = orders.reduce((sum, order) => sum + orderTotal(order), 0);

  return (
    <section className="flex min-w-[17rem] flex-1 flex-col rounded-xl border bg-muted/30">
      <header className="flex items-center gap-2 border-b bg-card px-3 py-2.5 rounded-t-xl">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg border",
            tone.soft
          )}
        >
          <column.Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold leading-tight">{column.label}</h2>
          {value > 0 && (
            <p className="text-xs text-muted-foreground tabular">
              {formatMoney(value)}
            </p>
          )}
        </div>
        <span
          className={cn(
            "flex h-6 min-w-[1.5rem] items-center justify-center rounded-full px-1.5 text-xs font-bold tabular border",
            orders.length > 0 ? tone.soft : "border-border bg-muted text-muted-foreground"
          )}
        >
          {orders.length}
        </span>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-2 custom-scrollbar">
        {orders.length === 0 ? (
          <p className="flex h-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Nothing here
          </p>
        ) : (
          orders.map((order) => (
            <TicketCard
              key={order._id}
              order={order}
              column={column}
              onAdvance={onAdvance}
              onRegress={onRegress}
              onBill={onBill}
              busy={busyId === order._id}
              billing={
                billingTable != null &&
                billingTable === (order.tableId?._id ?? order.tableId)
              }
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function LiveOrdersPage() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { hotelId } = useAuth();

  const [refresh, setRefresh] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [billingTable, setBillingTable] = useState(null);

  const { loading, error } = useGetAllOrders("order", { refresh, setRefresh });
  const board = useSelector((state) => state.order.getAllOrders.data);

  useTicker();

  const columns = useMemo(
    () =>
      COLUMNS.map((column) => ({
        column,
        orders: board?.[column.key] ?? [],
      })),
    [board]
  );

  const move = useCallback(
    async (order, status) => {
      setBusyId(order._id);
      await dispatch(updateOrderStatus(order._id, status));
      setBusyId(null);
      setRefresh(true);
    },
    [dispatch]
  );

  const advance = (order) => {
    const current = COLUMNS.find((c) => c.key === order.status);
    if (current?.next) move(order, current.next);
  };

  const regress = (order) => {
    const index = COLUMNS.findIndex((c) => c.key === order.status);
    if (index > 0) move(order, COLUMNS[index - 1].key);
  };

  /**
   * Generates the table's bill and opens it.
   *
   * The API refuses while anything is still in the kitchen, so the message it
   * returns is more useful than a generic failure — it names what is blocking.
   */
  const generateBill = async (order) => {
    const tableId = order.tableId?._id ?? order.tableId;
    const tableNo = order.tableId?.sequence ?? "";
    setBillingTable(tableId);
    try {
      const { data } = await api.get(`/tables/bill/${tableId}`);
      const bill = data?.data?.bill;
      if (bill?._id) {
        router.push(`/bill/${bill._id}`);
      } else {
        toast({ title: "Couldn't open that bill", variant: "destructive" });
      }
    } catch (err) {
      toast({
        title: `Table ${tableNo} isn't ready to bill`,
        description: getErrorMessage(err),
        variant: "warning",
      });
    } finally {
      setBillingTable(null);
    }
  };

  const totalLive = columns
    .filter(({ column }) => column.key !== "completed")
    .reduce((sum, { orders }) => sum + orders.length, 0);

  if (error) {
    return (
      <ErrorState
        title="Couldn't load the board"
        description={error}
        onRetry={() => setRefresh(true)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Kitchen board</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : totalLive === 0
                ? "Nothing in the kitchen right now."
                : `${totalLive} order${totalLive === 1 ? "" : "s"} in progress`}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => setRefresh(true)}
          disabled={loading}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      {loading && !board ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.key} className="shimmer h-64 rounded-xl" />
          ))}
        </div>
      ) : totalLive === 0 && (board?.completed?.length ?? 0) === 0 ? (
        <EmptyState
          Icon={UtensilsCrossed}
          title="No live orders"
          description="Orders placed from a table's QR code land here the moment a diner confirms them."
        />
      ) : (
        // Four equal columns across the full width. The board previously
        // shared the row with a seated-tables panel, which squeezed "Served"
        // until its cards clipped behind it — and made a waiter match a table
        // number across two places to take payment.
        <div className="scroll-x -mx-1 flex gap-3 px-1 pb-2">
          {columns.map(({ column, orders }) => (
            <Column
              key={column.key}
              column={column}
              orders={orders}
              onAdvance={advance}
              onRegress={column.key === "pending" ? null : regress}
              onBill={generateBill}
              busyId={busyId}
              billingTable={billingTable}
            />
          ))}
        </div>
      )}
    </div>
  );
}

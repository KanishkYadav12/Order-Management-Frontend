"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  RotateCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { BillStatusBadge } from "@/components/ui/status-badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBills } from "@/hooks/bill/useBills";
import { useDebounce } from "@/hooks/useDebounce";
import { formatMoney, formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "", label: "All" },
  { value: "unpaid", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

/**
 * How the period is chosen.
 *
 * Rolling windows ("last 30 days") answer a different question from the one
 * this screen is usually asked: takings for a *named* day, or a *named* month,
 * which is what gets reconciled against a cash drawer or handed to an
 * accountant. All three modes still resolve to the same from/to pair the API
 * already accepts.
 */
const MODES = [
  { id: "day", label: "Day" },
  { id: "month", label: "Month" },
  { id: "range", label: "Range" },
  { id: "all", label: "All" },
];

const isoDay = (date) => {
  const local = new Date(date);
  local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
  return local.toISOString().slice(0, 10);
};

const isoMonth = (date) => isoDay(date).slice(0, 7);

/** Inclusive bounds, so a bill settled at 23:59 still counts for that day. */
const startOf = (value) => `${value}T00:00:00.000`;
const endOfDay = (value) => `${value}T23:59:59.999`;

const endOfMonth = (value) => {
  const [year, month] = value.split("-").map(Number);
  // Day 0 of the next month is the last day of this one, leap years included.
  const last = new Date(year, month, 0).getDate();
  return endOfDay(`${value}-${String(last).padStart(2, "0")}`);
};

export default function BillsPage() {
  const router = useRouter();

  const [status, setStatus] = useState("");
  const [mode, setMode] = useState("all");
  const [day, setDay] = useState(() => isoDay(new Date()));
  const [month, setMonth] = useState(() => isoMonth(new Date()));
  const [fromDate, setFromDate] = useState(() => isoDay(new Date()));
  const [toDate, setToDate] = useState(() => isoDay(new Date()));
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const search = useDebounce(term, 350);

  const { from, to } = useMemo(() => {
    if (mode === "day") return { from: startOf(day), to: endOfDay(day) };
    if (mode === "month") return { from: startOf(`${month}-01`), to: endOfMonth(month) };
    if (mode === "range") {
      // Tolerate the dates being picked in either order.
      const [a, b] = fromDate <= toDate ? [fromDate, toDate] : [toDate, fromDate];
      return { from: startOf(a), to: endOfDay(b) };
    }
    return { from: undefined, to: undefined };
  }, [mode, day, month, fromDate, toDate]);

  const { bills, pagination, totals, loading, error, refetch, remove } = useBills({
    status,
    from,
    to,
    search,
    page,
  });

  /* Any filter change invalidates the current page number. */
  const applyFilter = (setter) => (value) => {
    setter(value);
    setPage(1);
  };

  const periodLabel =
    mode === "day"
      ? `on ${formatDate(day)}`
      : mode === "month"
        ? `in ${new Date(`${month}-01`).toLocaleString("en-IN", { month: "long", year: "numeric" })}`
        : mode === "range"
          ? `between ${formatDate(fromDate)} and ${formatDate(toDate)}`
          : "in total";

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const result = await remove(pendingDelete._id);
    setDeleting(false);
    if (result.ok) setPendingDelete(null);
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bills</h1>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading…"
              : `${formatNumber(pagination.total)} bill${pagination.total === 1 ? "" : "s"} ${periodLabel}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} className="gap-1.5">
          <RotateCw
            className={cn("h-4 w-4", loading && "animate-spin")}
            aria-hidden="true"
          />
          Refresh
        </Button>
      </header>

      {/* Filters — one row, above the data, per the interaction pattern used
          everywhere else in the app. */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setPage(1);
            }}
            placeholder="Guest name or invoice number"
            className="pl-9"
          />
        </div>

        <div className="flex rounded-lg border p-0.5">
          {STATUSES.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => applyFilter(setStatus)(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                status === option.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex rounded-lg border p-0.5">
          {MODES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => applyFilter(setMode)(option.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                mode === option.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Only the input the chosen mode needs. Native date/month controls
            bring the platform's own picker, including the mobile one. */}
        {mode === "day" && (
          <Input
            type="date"
            value={day}
            max={isoDay(new Date())}
            onChange={(event) => applyFilter(setDay)(event.target.value)}
            className="w-auto"
            aria-label="Day"
          />
        )}

        {mode === "month" && (
          <Input
            type="month"
            value={month}
            max={isoMonth(new Date())}
            onChange={(event) => applyFilter(setMonth)(event.target.value)}
            className="w-auto"
            aria-label="Month"
          />
        )}

        {mode === "range" && (
          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={fromDate}
              max={isoDay(new Date())}
              onChange={(event) => applyFilter(setFromDate)(event.target.value)}
              className="w-auto"
              aria-label="From"
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              type="date"
              value={toDate}
              max={isoDay(new Date())}
              onChange={(event) => applyFilter(setToDate)(event.target.value)}
              className="w-auto"
              aria-label="To"
            />
          </div>
        )}
      </div>

      {/* What the filtered period actually took. Computed across every
          matching bill server-side, so paging does not change the number. */}
      {!loading && !error && pagination.total > 0 && (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Settled
            </p>
            <p className="text-xl font-bold tabular">{formatMoney(totals.settled)}</p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(totals.settledCount)} paid
            </p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Outstanding
            </p>
            <p className="text-xl font-bold tabular">
              {formatMoney(totals.gross - totals.settled)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatNumber(totals.count - totals.settledCount)} open
            </p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-3">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Average bill
            </p>
            <p className="text-xl font-bold tabular">
              {formatMoney(
                totals.settledCount > 0 ? totals.settled / totals.settledCount : 0
              )}
            </p>
            <p className="text-xs text-muted-foreground">per settled bill</p>
          </div>
        </div>
      )}

      {error ? (
        <ErrorState title="Couldn't load bills" description={error} onRetry={refetch} />
      ) : loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="shimmer h-16 rounded-lg" />
          ))}
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          Icon={Receipt}
          title="No bills match that"
          description={
            search || status || mode !== "all"
              ? "Try widening the date range or clearing the search."
              : "Bills appear here once a table is billed from the order board."
          }
          action={() => router.push("/order-page")}
          actionLabel="Go to the order board"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {/* Header row is desktop-only; each bill becomes a stacked card on
              narrow screens through CSS, not a window.innerWidth branch that
              renders differently on the server than in the browser. */}
          <div className="hidden border-b bg-muted/40 px-4 py-2.5 text-2xs font-semibold uppercase tracking-wider text-muted-foreground md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_6rem_7rem_auto] md:gap-4">
            <span>Guest</span>
            <span>Invoice</span>
            <span className="text-center">Table</span>
            <span className="text-right">Items</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>

          <ul className="divide-y">
            {bills.map((bill) => {
              const items = (bill.orderedItems ?? []).reduce(
                (total, item) => total + (item.quantity ?? 0),
                0
              );

              return (
                <li
                  key={bill._id}
                  className="group relative gap-1 px-4 py-3 transition-colors hover:bg-muted/40 md:grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_5rem_6rem_7rem_auto] md:items-center md:gap-4"
                >
                  <button
                    type="button"
                    onClick={() => router.push(`/bill/${bill._id}`)}
                    className="absolute inset-0 z-0"
                    aria-label={`Open bill for ${bill.customerName ?? "guest"}`}
                  />

                  <div className="pointer-events-none min-w-0">
                    <p className="truncate font-medium">
                      {bill.customerName ?? "Guest"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(bill.settledAt ?? bill.createdAt)}
                    </p>
                  </div>

                  <p className="pointer-events-none truncate font-mono text-xs text-muted-foreground">
                    {bill.invoiceNumber ?? "—"}
                  </p>

                  <p className="pointer-events-none text-sm tabular md:text-center">
                    {bill.tableId?.sequence ?? "—"}
                  </p>

                  <p className="pointer-events-none text-sm tabular text-muted-foreground md:text-right">
                    {items}
                  </p>

                  <p className="pointer-events-none font-semibold tabular md:text-right">
                    {formatMoney(bill.finalAmount)}
                  </p>

                  <div className="mt-2 flex items-center gap-2 md:mt-0 md:justify-end">
                    <BillStatusBadge status={bill.status} size="sm" />

                    <ArrowUpRight
                      className="pointer-events-none hidden h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 md:block"
                      aria-hidden="true"
                    />

                    {/* Settled bills are part of the sales record; the API
                        refuses to delete them, so don't offer the button. */}
                    {bill.status !== "paid" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="relative z-10 h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPendingDelete(bill);
                        }}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete this bill</span>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pagination.pages > 1 && (
        <nav className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.pages}
              onClick={() => setPage((current) => current + 1)}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bill?</AlertDialogTitle>
            <AlertDialogDescription>
              The bill for {pendingDelete?.customerName ?? "this guest"} —{" "}
              {formatMoney(pendingDelete?.finalAmount)} — will be removed. The
              orders behind it are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                // Keep the dialog open until the request resolves.
                event.preventDefault();
                confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

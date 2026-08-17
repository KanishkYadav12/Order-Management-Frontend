"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Minus,
  Loader2,
  Armchair,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ErrorState } from "@/components/ui/empty-state";
import { useOrderEntryData, useCreateOrder } from "@/hooks/order/useCreateOrder";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const TABLE_TONE = {
  free: "border-table-free/40 bg-table-free/10 text-table-free",
  occupied: "border-table-occupied/40 bg-table-occupied/10 text-table-occupied",
  reserved: "border-table-reserved/40 bg-table-reserved/10 text-table-reserved",
  cleaning: "border-table-cleaning/40 bg-table-cleaning/10 text-table-cleaning",
};

export default function NewOrderDialog({ open, onOpenChange, onCreated }) {
  const { tables, dishes, loading, error, reload } = useOrderEntryData(open);
  const { createOrder, saving } = useCreateOrder();

  const [tableId, setTableId] = useState(null);
  const [guest, setGuest] = useState("");
  const [note, setNote] = useState("");
  const [term, setTerm] = useState("");
  const [cart, setCart] = useState({});

  const reset = () => {
    setTableId(null);
    setGuest("");
    setNote("");
    setTerm("");
    setCart({});
  };

  const close = (nextOpen) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const available = useMemo(
    () => dishes.filter((dish) => !dish.isDeleted && dish.available !== false),
    [dishes]
  );

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return available;
    return available.filter(
      (dish) =>
        dish.name?.toLowerCase().includes(needle) ||
        dish.category?.name?.toLowerCase().includes(needle)
    );
  }, [available, term]);

  const lines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => ({
          dish: available.find((dish) => dish._id === id),
          quantity,
        }))
        .filter((line) => line.dish),
    [cart, available]
  );

  const total = lines.reduce(
    (sum, { dish, quantity }) => sum + (dish.price ?? 0) * quantity,
    0
  );

  const bump = (id, delta) =>
    setCart((current) => {
      const next = Math.max(0, (current[id] ?? 0) + delta);
      const copy = { ...current };
      if (next === 0) delete copy[id];
      else copy[id] = next;
      return copy;
    });

  const drop = (id) =>
    setCart((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });

  const submit = async () => {
    const result = await createOrder({
      tableId,
      customerName: guest,
      note,
      items: lines.map(({ dish, quantity }) => ({ dishId: dish._id, quantity })),
    });
    if (result.ok) {
      close(false);
      onCreated?.(result.order);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="flex max-h-[92vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>New order</DialogTitle>
          <DialogDescription>
            For a walk-in, a phone order, or a table that waved you over.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="p-5">
            <ErrorState
              title="Couldn't load the menu"
              description={error}
              onRetry={reload}
            />
          </div>
        ) : loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="shimmer h-12 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-[1fr_18rem]">
            {/* Left: which table, then what they want */}
            <div className="min-h-0 space-y-4 overflow-y-auto p-5">
              <section>
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Table
                </p>
                {tables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tables yet — add them under Floor.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tables.map((table) => (
                      <button
                        key={table._id}
                        type="button"
                        onClick={() => setTableId(table._id)}
                        title={`Table ${table.sequence} - ${table.status}`}
                        className={cn(
                          "flex h-11 min-w-[3.25rem] items-center justify-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors",
                          tableId === table._id
                            ? "border-primary bg-primary text-primary-foreground"
                            : (TABLE_TONE[table.status] ?? "hover:bg-muted")
                        )}
                      >
                        <Armchair className="h-3.5 w-3.5" aria-hidden="true" />
                        {table.sequence}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <div className="relative mb-2">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    placeholder="Search the menu"
                    className="pl-9"
                  />
                </div>

                <ul className="divide-y rounded-lg border">
                  {visible.length === 0 && (
                    <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                      Nothing on the menu matches that.
                    </li>
                  )}
                  {visible.map((dish) => {
                    const quantity = cart[dish._id] ?? 0;

                    return (
                      <li key={dish._id} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{dish.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(dish.price)}
                            {dish.category?.name ? ` · ${dish.category.name}` : ""}
                          </p>
                        </div>

                        {quantity > 0 ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => bump(dish._id, -1)}
                              aria-label={`One less ${dish.name}`}
                            >
                              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                            <span className="w-6 text-center text-sm font-semibold tabular">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => bump(dish._id, 1)}
                              aria-label={`One more ${dish.name}`}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => bump(dish._id, 1)}
                            className="gap-1"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            Add
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            {/* Right: the ticket exactly as the kitchen will get it */}
            <aside className="flex min-h-0 flex-col border-t bg-muted/30 md:border-l md:border-t-0">
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <p className="mb-2 text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ticket
                </p>

                {lines.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-center">
                    <UtensilsCrossed
                      className="h-7 w-7 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Nothing added yet.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {lines.map(({ dish, quantity }) => (
                      <li key={dish._id} className="flex items-start gap-2 text-sm">
                        <span className="w-6 shrink-0 font-semibold tabular">
                          {quantity}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{dish.name}</span>
                        <span className="tabular text-muted-foreground">
                          {formatMoney((dish.price ?? 0) * quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => drop(dish._id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`Remove ${dish.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Guest name{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </label>
                    <Input
                      value={guest}
                      onChange={(event) => setGuest(event.target.value)}
                      placeholder="Walk-in"
                      className="h-9"
                    />
                    {/* Spelled out because it is the question staff ask first. */}
                    <p className="mt-1 text-2xs text-muted-foreground">
                      No name or phone needed — it files as a guest.
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Note for the kitchen
                    </label>
                    <Textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Less spicy, no onion..."
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t p-4">
                <div className="mb-1 flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Items total</span>
                  <span className="text-lg font-bold tabular">
                    {formatMoney(total)}
                  </span>
                </div>
                <p className="mb-3 text-2xs text-muted-foreground">
                  Tax and service charge are added on the bill.
                </p>
                <Button
                  className="w-full gap-1.5"
                  disabled={saving || !tableId || lines.length === 0}
                  onClick={submit}
                >
                  {saving && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  {tableId ? "Send to kitchen" : "Pick a table"}
                </Button>
              </div>
            </aside>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  Mail,
  ArrowLeft,
  Loader2,
  BadgeIndianRupee,
  Percent,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ErrorState, EmptyState } from "@/components/ui/empty-state";
import { BillStatusBadge } from "@/components/ui/status-badge";
import { useBill } from "@/hooks/bill/useBill";
import { formatMoney, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "wallet", label: "Wallet" },
];

/** One line of the totals block. */
function Row({ label, value, negative, strong, muted }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <dt className={cn("text-sm", muted ? "text-muted-foreground" : "", strong && "font-semibold")}>
        {label}
      </dt>
      <dd
        className={cn(
          "tabular",
          strong ? "text-lg font-bold" : "text-sm",
          negative && "text-success"
        )}
      >
        {negative ? "−" : ""}
        {value}
      </dd>
    </div>
  );
}

function SettleDialog({ open, onOpenChange, bill, onSettle, saving }) {
  const [method, setMethod] = useState("upi");
  const [email, setEmail] = useState(bill?.customerEmail ?? "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            This frees the table and closes the sitting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-3 text-center">
            <p className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
              Amount due
            </p>
            <p className="mt-0.5 text-3xl font-bold tabular">
              {formatMoney(bill?.finalAmount)}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium">Paid by</p>
            <div className="grid grid-cols-2 gap-2">
              {METHODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg border py-2.5 text-sm font-medium transition-colors",
                    method === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  {method === option.value && (
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Email the receipt{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="guest@example.com"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              const result = await onSettle({ method, customerEmail: email });
              if (result.ok) onOpenChange(false);
            }}
            className="gap-1.5"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Mark paid
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DiscountDialog({ open, onOpenChange, bill, onApply, saving }) {
  const [amount, setAmount] = useState(String(bill?.customDiscount ?? 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Discount</DialogTitle>
          <DialogDescription>
            A flat amount off this bill. It replaces any previous discount
            rather than adding to it.
          </DialogDescription>
        </DialogHeader>

        <Input
          type="number"
          min="0"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="tabular text-lg"
          autoFocus
        />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={saving}
            onClick={async () => {
              const result = await onApply({ customDiscount: Number(amount) || 0 });
              if (result.ok) onOpenChange(false);
            }}
            className="gap-1.5"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BillPage() {
  const { id } = useParams();
  const router = useRouter();
  const { bill, loading, error, saving, refetch, update, settle, emailTo } =
    useBill(id);

  const [settleOpen, setSettleOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <div className="shimmer h-10 rounded-lg" />
        <div className="shimmer h-[28rem] rounded-xl" />
      </div>
    );
  }

  if (error) {
    return <ErrorState title="Couldn't load this bill" description={error} onRetry={refetch} />;
  }

  if (!bill) {
    return (
      <EmptyState
        title="Bill not found"
        description="It may have been settled and cleared, or the link is out of date."
        action={() => router.push("/dashboard/bills")}
        actionLabel="Back to bills"
      />
    );
  }

  const hotel = bill.hotelId ?? {};
  const paid = bill.status === "paid";

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* Toolbar — excluded from print */}
      <div className="no-print flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Button>

        <div className="ml-auto flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={saving}
            onClick={() => {
              const address =
                bill.customerEmail ||
                window.prompt("Send this bill to which email address?");
              if (address) emailTo(address);
            }}
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            Email
          </Button>

          {!paid && (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setDiscountOpen(true)}
              >
                <Percent className="h-4 w-4" aria-hidden="true" />
                Discount
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => setSettleOpen(true)}>
                <BadgeIndianRupee className="h-4 w-4" aria-hidden="true" />
                Take payment
              </Button>
            </>
          )}
        </div>
      </div>

      {/* The invoice itself */}
      <article className="print-full overflow-hidden rounded-xl border bg-card">
        <header className="border-b p-5 text-center">
          <h1 className="text-xl font-bold tracking-tight">{hotel.name ?? "Restaurant"}</h1>
          {hotel.location && (
            <p className="mt-0.5 text-xs text-muted-foreground">{hotel.location}</p>
          )}
          {hotel.phone && (
            <p className="text-xs text-muted-foreground">{hotel.phone}</p>
          )}
          {hotel.billing?.gstin && (
            <p className="mt-1.5 font-mono text-2xs text-muted-foreground">
              GSTIN {hotel.billing.gstin}
            </p>
          )}
        </header>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-b bg-muted/30 p-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Invoice</p>
            <p className="truncate font-mono text-xs font-semibold">
              {bill.invoiceNumber ?? "Not issued"}
            </p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Table</p>
            <p className="font-semibold tabular">{bill.tableId?.sequence ?? "—"}</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Guest</p>
            <p className="truncate font-semibold">{bill.customerName ?? "Guest"}</p>
          </div>
          <div>
            <p className="text-2xs uppercase tracking-wider text-muted-foreground">Status</p>
            <BillStatusBadge status={bill.status} size="sm" />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b text-2xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2 text-left font-semibold">Item</th>
              <th className="px-2 py-2 text-center font-semibold">Qty</th>
              <th className="px-2 py-2 text-right font-semibold">Rate</th>
              <th className="px-4 py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(bill.orderedItems ?? []).map((item, index) => (
              <tr key={item.dishId?._id ?? index}>
                <td className="px-4 py-2.5 text-sm">
                  {item.name ?? item.dishId?.name ?? "Item"}
                  {item.discount > 0 && (
                    <span className="ml-1.5 text-xs text-success">
                      offer −{formatMoney(item.discount)}
                    </span>
                  )}
                </td>
                <td className="px-2 py-2.5 text-center text-sm tabular">{item.quantity}</td>
                <td className="px-2 py-2.5 text-right text-sm tabular text-muted-foreground">
                  {formatMoney(item.unitPrice ?? item.dishId?.price ?? 0)}
                </td>
                <td className="px-4 py-2.5 text-right text-sm font-medium tabular">
                  {formatMoney(item.lineTotal ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="space-y-0 border-t p-4">
          <Row label="Subtotal" value={formatMoney(bill.subTotal ?? bill.totalAmount)} />
          {bill.itemDiscount > 0 && (
            <Row label="Item offers" value={formatMoney(bill.itemDiscount)} negative />
          )}
          {bill.offerDiscount > 0 && (
            <Row label="Bill offer" value={formatMoney(bill.offerDiscount)} negative />
          )}
          {bill.customDiscount > 0 && (
            <Row label="Discount" value={formatMoney(bill.customDiscount)} negative />
          )}
          {bill.cgst > 0 && <Row label="CGST" value={formatMoney(bill.cgst)} />}
          {bill.sgst > 0 && <Row label="SGST" value={formatMoney(bill.sgst)} />}
          {bill.serviceCharge > 0 && (
            <Row
              label={`Service charge (${bill.serviceChargePercent}%)`}
              value={formatMoney(bill.serviceCharge)}
            />
          )}
          {Boolean(bill.roundOff) && (
            <Row label="Round off" value={formatMoney(bill.roundOff)} muted />
          )}

          <div className="mt-2 border-t-2 border-foreground pt-2">
            <Row label="Total" value={formatMoney(bill.finalAmount)} strong />
          </div>

          {(bill.payments ?? []).map((payment, index) => (
            <Row
              key={index}
              label={`Paid · ${payment.method}`}
              value={formatMoney(payment.amount)}
              muted
            />
          ))}
        </dl>

        <footer className="border-t bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            {hotel.billing?.footerNote ?? "Thank you for dining with us!"}
          </p>
          <p className="mt-1 text-2xs text-muted-foreground">
            {formatDateTime(bill.settledAt ?? bill.createdAt)}
          </p>
        </footer>
      </article>

      <SettleDialog
        open={settleOpen}
        onOpenChange={setSettleOpen}
        bill={bill}
        onSettle={settle}
        saving={saving}
      />
      <DiscountDialog
        open={discountOpen}
        onOpenChange={setDiscountOpen}
        bill={bill}
        onApply={update}
        saving={saving}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ReceiptText } from "lucide-react";
import api, { getErrorMessage } from "@/lib/api";
import { ErrorState } from "@/components/ui/empty-state";

/**
 * Opens the bill for a **table**.
 *
 * `GET /tables/bill/:tableId` builds (or refreshes) the open bill for a table
 * and returns it. Everything after that — the invoice, discounts, payment — is
 * the same screen no matter how you arrived, so this route resolves the table
 * to a bill id and hands over to `/bill/[id]` rather than maintaining a second,
 * subtly different copy of the billing UI.
 */
export default function TableBillPage() {
  const { id } = useParams();
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    const open = async () => {
      setError(null);
      try {
        const { data } = await api.get(`/tables/bill/${id}`);
        const billId = data?.data?.bill?._id ?? data?.data?.billDetails?._id;
        if (cancelled) return;

        if (billId) {
          // `replace`, so Back returns to the board rather than bouncing here.
          router.replace(`/bill/${billId}`);
        } else {
          setError("The bill came back empty. Try again from the order board.");
        }
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err));
      }
    };

    open();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  if (error) {
    return (
      <div className="mx-auto max-w-lg">
        <ErrorState
          title="Can't bill this table yet"
          description={error}
          onRetry={() => router.refresh()}
        />
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => router.push("/order-page")}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to the order board
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-primary/10">
        <ReceiptText className="h-6 w-6 text-primary" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-medium">Preparing the bill…</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Totalling everything served on this table.
      </p>
    </div>
  );
}

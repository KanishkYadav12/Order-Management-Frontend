"use client";

import { useState, useEffect, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * Loads one bill **by its own id**.
 *
 * The bill page previously used `useGetTableBill`, which calls
 * `GET /tables/bill/:tableId` — the endpoint that *generates* a bill for a
 * table. Handed a bill id it looked for a table with that id, found none, and
 * the page rendered "Bill not found" for a bill that existed. Two different
 * identifiers, two different endpoints.
 */
export const useBill = (billId) => {
  const [bill, setBill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!billId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/bills/${billId}`);
      setBill(data?.data?.bill ?? data?.data?.billDetails ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [billId]);

  useEffect(() => {
    load();
  }, [load]);

  /** Applies a discount, guest name or email, then reloads the recomputed bill. */
  const update = async (changes) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/bills/${billId}`, changes);
      setBill(data?.data?.bill ?? bill);
      toast({ title: "Bill updated", variant: "success" });
      return { ok: true };
    } catch (err) {
      toast({
        title: "Couldn't update the bill",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  const settle = async ({ method, customerEmail }) => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/bills/paid/${billId}`, {
        method,
        ...(customerEmail ? { customerEmail } : {}),
      });
      setBill(data?.data?.bill ?? bill);
      toast({
        title: "Payment recorded",
        description: "The table is now free.",
        variant: "success",
      });
      return { ok: true };
    } catch (err) {
      toast({
        title: "Couldn't record payment",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  const emailTo = async (address) => {
    setSaving(true);
    try {
      await api.post(`/bills/send-bill/${billId}`, { email: address });
      toast({ title: `Sent to ${address}`, variant: "success" });
      return { ok: true };
    } catch (err) {
      toast({
        title: "Couldn't send it",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  return { bill, loading, error, saving, refetch: load, update, settle, emailTo };
};

export default useBill;

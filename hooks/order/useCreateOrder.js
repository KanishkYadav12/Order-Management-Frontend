"use client";

import { useState, useEffect, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * Staff-side order entry.
 *
 * The board could show orders and advance them but had no way to *start* one,
 * so anything that did not arrive through a diner's QR scan — a walk-in, a
 * phone order, a table that waved someone over — could not be entered at all.
 *
 * Note there is no phone field anywhere in this flow. The API never asked for
 * one: `createOrderSchema` accepts an optional `customerName` and nothing
 * else about the guest, and the service falls back to "Guest". A walk-in with
 * no phone, no email and no name is a first-class case, not an edge one.
 */
export const useOrderEntryData = (open) => {
  const [tables, setTables] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tableRes, dishRes] = await Promise.all([
        api.get("/tables"),
        api.get("/dishes"),
      ]);
      setTables(tableRes.data?.data?.tables ?? []);
      setDishes(dishRes.data?.data?.dishes ?? []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  return { tables, dishes, loading, error, reload: load };
};

export const useCreateOrder = () => {
  const [saving, setSaving] = useState(false);

  const createOrder = async ({ tableId, customerName, items, note }) => {
    if (!tableId) {
      toast({ title: "Pick a table first", variant: "destructive" });
      return { ok: false };
    }
    if (!items?.length) {
      toast({ title: "Add at least one dish", variant: "destructive" });
      return { ok: false };
    }

    setSaving(true);
    try {
      const { data } = await api.post(`/orders/${tableId}`, {
        // Sent only when filled in — the server turns a missing name into
        // "Guest", which is the right label for a walk-in.
        ...(customerName?.trim() ? { customerName: customerName.trim() } : {}),
        ...(note?.trim() ? { note: note.trim() } : {}),
        dishes: items.map(({ dishId, quantity, note: itemNote }) => ({
          dishId,
          quantity,
          ...(itemNote?.trim() ? { note: itemNote.trim() } : {}),
        })),
        // Straight to the kitchen. A draft would sit invisible on the board.
        status: "pending",
      });

      toast({ title: "Order sent to the kitchen", variant: "success" });
      return { ok: true, order: data?.data?.order ?? null };
    } catch (err) {
      toast({
        title: "Couldn't place that order",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    } finally {
      setSaving(false);
    }
  };

  return { createOrder, saving };
};

export default useCreateOrder;

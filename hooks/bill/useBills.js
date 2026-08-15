"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api, { getErrorMessage } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

const EMPTY_PAGINATION = { page: 1, limit: 20, total: 0, pages: 1 };

/**
 * The bill list, filtered and paged **on the server**.
 *
 * The previous screen fetched one page and then filtered it in the browser, so
 * "bills in March" searched only the twenty most recent bills and quietly
 * returned nothing. `GET /bills` already accepts status, date range, search and
 * paging — this uses them.
 */
export const useBills = (filters = {}) => {
  const { status, from, to, search, page = 1, limit = 20 } = filters;

  const [bills, setBills] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guards against a slow early request overwriting a newer, faster one.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const ticket = ++requestId.current;
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get("/bills", {
        params: {
          page,
          limit,
          ...(status ? { status } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(search ? { search } : {}),
        },
      });

      if (ticket !== requestId.current) return;
      setBills(data?.data?.bills ?? []);
      setPagination(data?.data?.pagination ?? EMPTY_PAGINATION);
    } catch (err) {
      if (ticket !== requestId.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (ticket === requestId.current) setLoading(false);
    }
  }, [status, from, to, search, page, limit]);

  useEffect(() => {
    load();
  }, [load]);

  /** Only unsettled bills can be removed; the API enforces it too. */
  const remove = async (billId) => {
    try {
      await api.delete(`/bills/${billId}`);
      setBills((current) => current.filter((bill) => bill._id !== billId));
      setPagination((current) => ({
        ...current,
        total: Math.max(0, current.total - 1),
      }));
      toast({ title: "Bill deleted", variant: "success" });
      return { ok: true };
    } catch (err) {
      toast({
        title: "Couldn't delete that bill",
        description: getErrorMessage(err),
        variant: "destructive",
      });
      return { ok: false };
    }
  };

  return { bills, pagination, loading, error, refetch: load, remove };
};

export default useBills;

"use client";

import { useState, useEffect, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";

/**
 * Reports whether the conversational assistant is configured.
 *
 * The analytics endpoints never depend on this — they're plain statistics on
 * your own data — so the UI shows them regardless and only gates the chat.
 */
export const useAiStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/ai/status")
      .then(({ data }) => {
        if (!cancelled) setStatus(data?.data ?? null);
      })
      .catch(() => {
        if (!cancelled) setStatus({ enabled: false, analyticsAvailable: true });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { status, loading };
};

/** Fetches one of the analytics reports. */
export const useReport = (path, params) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(params ?? {});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/ai/${path}`, { params });
      setData(response.data?.data ?? null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // `key` stands in for a deep compare of params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, refetch: load };
};

/**
 * The question/answer loop.
 *
 * Keeps the whole exchange so the page can render a transcript, including
 * the underlying report — the answer is written from figures the server
 * computed, and being able to see them is what makes it trustworthy.
 */
export const useAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);

  const send = useCallback(async (question) => {
    const trimmed = question.trim();
    if (!trimmed || pending) return;

    setMessages((current) => [
      ...current,
      { role: "user", text: trimmed, id: `q-${Date.now()}` },
    ]);
    setPending(true);

    try {
      const { data } = await api.post("/ai/ask", { question: trimmed });
      const result = data?.data ?? {};

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          id: `a-${Date.now()}`,
          text: result.answer,
          report: result.report,
          data: result.data,
          generated: result.generated,
          note: result.note,
        },
      ]);
    } catch (err) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          id: `e-${Date.now()}`,
          error: getErrorMessage(err),
        },
      ]);
    } finally {
      setPending(false);
    }
  }, [pending]);

  const reset = useCallback(() => setMessages([]), []);

  return { messages, pending, send, reset };
};

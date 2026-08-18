"use client";

import { useState, useEffect, useCallback } from "react";
import api, { getErrorMessage } from "@/lib/api";

/**
 * The advisor conversation.
 *
 * Distinct from `useAssistant`, which fires a single stateless question at one
 * report. This keeps a thread: the server stores every turn, so "and what
 * about the weekend?" still means something on the next message.
 */
export const useAdvisor = () => {
  const [conversationId, setConversationId] = useState(null);
  const [turns, setTurns] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState(null);
  const [conversations, setConversations] = useState([]);

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get("/ai/conversations");
      setConversations(data?.data?.conversations ?? []);
    } catch {
      // The sidebar is a convenience; failing to list past chats must not
      // stop someone starting a new one.
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const send = async (message) => {
    const text = message.trim();
    if (!text || thinking) return;

    setError(null);
    // Show the question immediately — a 30-second wait with nothing on screen
    // reads as a broken button.
    setTurns((current) => [...current, { role: "user", text }]);
    setThinking(true);

    try {
      const { data } = await api.post("/ai/chat", {
        message: text,
        ...(conversationId ? { conversationId } : {}),
      });

      const payload = data?.data ?? {};
      setConversationId(payload.conversationId ?? null);
      setTurns((current) => [
        ...current,
        {
          role: "model",
          text: payload.reply ?? "",
          toolsUsed: payload.toolsUsed ?? [],
          groundedOn: payload.groundedOn ?? null,
        },
      ]);
      loadConversations();
    } catch (err) {
      setError(getErrorMessage(err));
      // Drop the orphaned question rather than leaving it looking answered.
      setTurns((current) => current.slice(0, -1));
    } finally {
      setThinking(false);
    }
  };

  const openConversation = async (id) => {
    setError(null);
    setThinking(true);
    try {
      const { data } = await api.get(`/ai/conversations/${id}`);
      const conversation = data?.data?.conversation;
      setConversationId(conversation?._id ?? null);
      setTurns(
        (conversation?.turns ?? []).map((turn) => ({
          role: turn.role,
          text: turn.text,
          toolsUsed: turn.toolsUsed ?? [],
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setThinking(false);
    }
  };

  const startNew = () => {
    setConversationId(null);
    setTurns([]);
    setError(null);
  };

  const removeConversation = async (id) => {
    try {
      await api.delete(`/ai/conversations/${id}`);
      setConversations((current) => current.filter((item) => item._id !== id));
      if (id === conversationId) startNew();
    } catch {
      // Nothing useful to say; the row simply stays.
    }
  };

  return {
    conversationId,
    turns,
    thinking,
    error,
    conversations,
    send,
    startNew,
    openConversation,
    removeConversation,
  };
};

export default useAdvisor;

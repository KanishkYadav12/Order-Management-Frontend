import { useEffect, useRef } from "react";
import * as Ably from "ably";
import { useDispatch } from "react-redux";

import {
  setConnectionStatus,
  setConnectionError,
  clearConnectionError,
} from "@/redux/slices/connectionSlice";
import { orderActions } from "@/redux/slices/orderSlice";
import { tableActions } from "@/redux/slices/tableSlice";
import api from "@/lib/api";

/**
 * Realtime kitchen feed.
 *
 * The Ably API key used to be a literal in this file, which put a key with
 * full publish and subscribe rights on every hotel channel into the browser
 * bundle for anyone to read. The client now asks the API for a short-lived,
 * subscribe-only token scoped to this hotel's channel alone, and Ably renews
 * it through the same endpoint when it expires.
 *
 * @param {string}  hotelId
 * @param {boolean} isSystemOnline
 */
const useAbly = (hotelId, isSystemOnline) => {
  const dispatch = useDispatch();
  const clientRef = useRef(null);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!hotelId || !isSystemOnline) {
      dispatch(setConnectionStatus(false));
      return undefined;
    }

    let cancelled = false;
    const channelName = `hotel-${hotelId}`;

    const connect = async () => {
      try {
        const client = new Ably.Realtime({
          /**
           * `authCallback` runs on connect and again whenever the token is
           * close to expiry, so the session survives past the token's hour
           * without the page needing to know about it.
           */
          authCallback: async (_tokenParams, callback) => {
            try {
              const { data } = await api.post("/realtime/token");
              callback(null, data.data.tokenRequest);
            } catch (err) {
              callback(err, null);
            }
          },
          closeOnUnload: true,
          disconnectedRetryTimeout: 5000,
          suspendedRetryTimeout: 10_000,
        });

        if (cancelled) {
          // Same reason as the cleanup below: closing a half-open client
          // rejects whatever it was still waiting on.
          try {
            client.connection.off();
            client.close();
          } catch {
            // Nothing useful to do with a client we are discarding anyway.
          }
          return;
        }

        clientRef.current = client;

        client.connection.on("connected", () => {
          dispatch(setConnectionStatus(true));
          dispatch(clearConnectionError());
        });
        client.connection.on("disconnected", () =>
          dispatch(setConnectionStatus(false))
        );
        client.connection.on("failed", (event) => {
          dispatch(setConnectionStatus(false));
          dispatch(
            setConnectionError(
              event?.reason?.message ?? "Live updates are unavailable."
            )
          );
        });

        const channel = client.channels.get(channelName);
        channelRef.current = channel;

        channel.subscribe("new-order", async (message) => {
          const orderId = message.data?.orderId;
          if (!orderId) return;

          try {
            // Goes through the shared client, so the request carries the
            // Authorization header — this used to be a bare axios call with
            // no credentials, which the API now rejects.
            const { data } = await api.get(`/orders/details/${orderId}`);
            const order = data?.data?.order;
            if (!order) return;

            dispatch(orderActions.setNewOrder(order));
            dispatch(tableActions.updateTableOnFirstOrder(order));
          } catch {
            // A dropped detail fetch is not fatal — the board refetches.
          }
        });

        channel.subscribe("order-update", (message) => {
          const orders = message.data?.orders;
          if (!orders) return;
          dispatch(
            orderActions.syncOrders({
              new: orders.new ?? [],
              inProgress: orders.inProgress ?? [],
              completed: orders.completed ?? [],
            })
          );
        });

        channel.subscribe("delete-order", (message) => {
          const orderId = message.data?.orderId;
          if (orderId) dispatch(orderActions.removeOrder(orderId));
        });
      } catch (err) {
        dispatch(setConnectionError(err.message));
      }
    };

    connect();

    return () => {
      cancelled = true;

      const client = clientRef.current;
      const channel = channelRef.current;
      channelRef.current = null;
      clientRef.current = null;

      /**
       * Unsubscribe only — never detach.
       *
       * `subscribe()` attaches the channel asynchronously, and in development
       * React unmounts the effect while that attach is still in flight.
       * Detaching then cancels it, and Ably reports the cancellation to the
       * channel's state listeners as "Attach request superseded by a
       * subsequent detach request". `client.close()` below tears every channel
       * down anyway, so the detach bought nothing and cost an error.
       *
       * `off()` first, so a channel that errors on the way out has no listener
       * left to surface it.
       */
      try {
        channel?.off?.();
        channel?.unsubscribe();
      } catch {
        // A channel that never attached has nothing to clean up.
      }

      if (!client) return;

      /**
       * Closing is noisy if you just call close().
       *
       * `close()` drives the connection to `closed`, and Ably reports that
       * transition by constructing an ErrorInfo ("Connection closed") which it
       * hands to every state listener and to any operation still in flight.
       * In development React mounts, unmounts and remounts effects, so the
       * cleanup routinely fires while `connect()` is still awaiting its token
       * — the pending request then rejects with that ErrorInfo, nothing is
       * listening, and Next's overlay shows it as a runtime error.
       *
       * So: drop our listeners first, absorb whatever the closure emits, and
       * skip the call entirely if the connection is already on its way out.
       */
      try {
        client.connection.off();
      } catch {
        // No listeners to remove.
      }

      try {
        client.connection.on("failed", () => {});
        client.connection.on("closed", () => {});
      } catch {
        // Best effort — the sinks only exist to keep the close quiet.
      }

      const state = client.connection?.state;
      if (state === "closed" || state === "closing") return;

      try {
        client.close();
      } catch {
        // Closing an already-closed client is harmless.
      }
    };
  }, [hotelId, isSystemOnline, dispatch]);

  return { channel: channelRef.current };
};

export default useAbly;

import axios from "axios";
import { serverUrl } from "@/config/config";

/**
 * The shared HTTP client.
 *
 * Two things changed from the previous version:
 *
 *   1. It no longer logs. The old interceptor printed JWT fragments, full
 *      request headers and response bodies to the browser console on every
 *      call — 20 statements in this file alone.
 *
 *   2. It handles token refresh. The access token now lives for 15 minutes,
 *      so a 401 is a routine event rather than a dead session. On a 401 the
 *      client calls /auth/refresh once, retries the original request, and
 *      only signs the user out if the refresh itself fails.
 */

const ACCESS_TOKEN_KEY = "accessToken";

/**
 * The access token is held in memory so it is not readable from storage by
 * injected script. `localStorage` is kept as a fallback purely so a page
 * reload can restore the session before the first refresh completes.
 */
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token ?? null;
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const getAccessToken = () => {
  if (accessToken) return accessToken;
  if (typeof window === "undefined") return null;
  accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  return accessToken;
};

export const clearAccessToken = () => setAccessToken(null);

const api = axios.create({
  baseURL: serverUrl,
  // Required so the httpOnly refresh cookie travels with /auth/refresh.
  withCredentials: true,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ── Refresh handling ─────────────────────────────────────────────────────
   A single in-flight refresh is shared by every request that 401s at the
   same moment, so a page issuing six parallel calls performs one refresh
   rather than six. */

let refreshPromise = null;

/** Called when the session cannot be recovered. Set by the auth provider. */
let onSessionExpired = () => {};
export const setSessionExpiredHandler = (handler) => {
  onSessionExpired = handler;
};

/** Endpoints where a 401 is the answer, not a recoverable session problem. */
const NO_RETRY = ["/auth/login", "/auth/refresh", "/auth/signup"];

const refreshSession = async () => {
  const { data } = await axios.post(
    `${serverUrl}/auth/refresh`,
    {},
    { withCredentials: true }
  );
  const token = data?.data?.token ?? data?.data?.accessToken;
  if (!token) throw new Error("No token in refresh response");
  setAccessToken(token);
  return token;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (
      response?.status !== 401 ||
      !config ||
      config._retried ||
      NO_RETRY.some((path) => config.url?.includes(path))
    ) {
      return Promise.reject(error);
    }

    // An expired-password or suspended-account 401 is terminal; only a
    // genuinely expired token is worth retrying.
    const code = response?.data?.code;
    if (code && !["TOKEN_EXPIRED", "UNAUTHENTICATED"].includes(code)) {
      return Promise.reject(error);
    }

    config._retried = true;

    try {
      refreshPromise = refreshPromise ?? refreshSession();
      const token = await refreshPromise;
      refreshPromise = null;

      config.headers.Authorization = `Bearer ${token}`;
      return api(config);
    } catch (refreshError) {
      refreshPromise = null;
      clearAccessToken();
      onSessionExpired();
      return Promise.reject(refreshError);
    }
  }
);

/**
 * Pulls a human-readable message out of an axios error.
 *
 * The API returns `{ message, code, details }`; `details` carries field-level
 * validation issues, and the first of those is more useful to show than the
 * generic summary.
 */
export const getErrorMessage = (error, fallback = "Something went wrong.") => {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details[0].message;
  if (data?.message) return data.message;
  if (error?.code === "ECONNABORTED") return "That took too long. Try again.";
  if (error?.message === "Network Error") {
    return "Can't reach the server. Check your connection.";
  }
  return error?.message ?? fallback;
};

/** Field-level validation issues, keyed by field name, for form highlighting. */
export const getFieldErrors = (error) => {
  const details = error?.response?.data?.details;
  if (!Array.isArray(details)) return {};
  return details.reduce(
    (acc, issue) => ({ ...acc, [issue.path ?? issue.field]: issue.message }),
    {}
  );
};

export default api;

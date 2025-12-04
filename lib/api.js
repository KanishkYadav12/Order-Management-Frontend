// src/lib/api.js
import axios from "axios";
import { store } from "@/redux/store";
import { authActions } from "@/redux/slices/authSlice";

// Create instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "",
});

// Request interceptor: attach Authorization header from Redux (fallback to localStorage)
api.interceptors.request.use(
  (config) => {
    console.log("🚀 ========== API REQUEST INTERCEPTOR ==========");
    console.log("🌐 Request URL:", config.url);
    console.log("🌐 Full URL:", config.baseURL + config.url);

    try {
      const state = store.getState ? store.getState() : null;

      console.log("📦 Redux state exists:", !!state);
      console.log("📦 Auth state:", state?.auth);
      console.log("📦 AuthDetails:", state?.auth?.authDetails);

      const tokenFromStore = state?.auth?.authDetails?.token;
      const tokenFromStorage =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      console.log(
        "🔑 Token from Redux:",
        tokenFromStore
          ? `${tokenFromStore.substring(0, 30)}...`
          : "❌ NOT FOUND"
      );
      console.log(
        "🔑 Token from localStorage:",
        tokenFromStorage
          ? `${tokenFromStorage.substring(0, 30)}...`
          : "❌ NOT FOUND"
      );

      const token = tokenFromStore || tokenFromStorage;

      console.log(
        "🔑 Final token to use:",
        token ? "✅ FOUND" : "❌ NOT FOUND"
      );

      if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization && !config.headers.authorization) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log(
            "✅ Authorization header SET:",
            `Bearer ${token.substring(0, 30)}...`
          );
        } else {
          console.log(
            "⚠️ Authorization header already exists, not overwriting"
          );
        }
      } else {
        console.log(
          "❌ NO TOKEN - Request will be sent WITHOUT Authorization header"
        );
      }

      console.log("📤 Final headers:", config.headers);
      console.log("🚀 ========================================");
    } catch (e) {
      console.log("❌ Interceptor error:", e);
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor: handle 401 globally (clear token + update redux)
api.interceptors.response.use(
  (res) => {
    console.log("✅ Response received:", res.config.url, "Status:", res.status);
    return res;
  },
  (error) => {
    console.log(
      "❌ Response error:",
      error.response?.status,
      error.response?.data
    );

    const status = error?.response?.status;
    if (status === 401) {
      console.log("🚨 401 Unauthorized - Clearing auth state");
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          console.log("🗑️ Token removed from localStorage");
        }
        store.dispatch(authActions.logoutSuccess());
        console.log("🗑️ Auth state cleared from Redux");
      } catch (e) {
        console.error("Error clearing auth:", e);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

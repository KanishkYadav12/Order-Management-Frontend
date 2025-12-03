import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Try to get token from multiple sources
    let token = null;

    // 1. Check localStorage first (most reliable)
    try {
      token = localStorage.getItem("authToken");
      if (token) {
        console.log("🔑 Token from localStorage: ✅ Found");
      }
    } catch (e) {
      console.log("⚠️ localStorage not available");
    }

    // 2. Fallback to cookie if localStorage doesn't have it
    if (!token) {
      token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("authToken="))
        ?.split("=")[1];
      if (token) {
        console.log("🔑 Token from cookie: ✅ Found");
      }
    }

    console.log("📍 Request URL:", config.url);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        "✅ Authorization header set:",
        token.substring(0, 20) + "..."
      );
    } else {
      console.log("❌ No token found - request will fail");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from authToken cookie (backend sets this during login)
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    console.log(
      "🔑 axiosInstance - Token from cookie:",
      token ? "✅ Found" : "❌ NOT Found"
    );
    console.log("📍 Request URL:", config.url);
    console.log("📦 Cookies:", document.cookie);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Authorization header set");
    } else {
      console.log("❌ No token - Authorization header NOT set");
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

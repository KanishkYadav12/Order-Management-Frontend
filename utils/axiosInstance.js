import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL,
  withCredentials: true,
});

// Add token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from cookie
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("authToken="))
      ?.split("=")[1];

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;

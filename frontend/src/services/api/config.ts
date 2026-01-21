import axios, { type AxiosInstance } from "axios";
import { tokenManager } from "./tokenManager";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
    withCredentials: true,
  });

  // Load tokens from localStorage on init
  tokenManager.loadTokens();

  // Request interceptor to add access token and log requests
  client.interceptors.request.use(
    (config) => {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);

      const token = tokenManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 Authorization header set");
      }

      console.log("🍪 Outgoing cookies:", document.cookie);
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor for error handling and token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If 401 and not already retried, attempt token refresh
      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/auth/")
      ) {
        originalRequest._retry = true;

        try {
          console.log("🔄 Attempting to refresh token...");

          // Call refresh endpoint
          const refreshResponse = await client.post("/auth/refresh", {});
          console.log("✅ Token refreshed successfully");

          // Update stored token if returned in response
          if (refreshResponse.data.access_token) {
            tokenManager.setAccessToken(refreshResponse.data.access_token);
          }

          // Add new token to original request
          const newToken = tokenManager.getAccessToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          // Retry the original request with the new token
          return client(originalRequest);
        } catch (refreshError: unknown) {
          const err = refreshError as {
            response?: { data?: unknown };
            message?: string;
          };
          console.error(
            "❌ Token refresh failed:",
            err?.response?.data || err?.message,
          );
          throw {
            detail: "Session expired. Please login again.",
            status: 401,
          };
        }
      }

      if (error.response) {
        console.error("API Error:", error.response.data);
        throw {
          detail: error.response.data.detail || "An error occurred",
          status: error.response.status,
        };
      } else if (error.request) {
        console.error("Network Error:", error.request);
        throw { detail: "Network error. Please check your connection." };
      } else {
        console.error("Error:", error.message);
        throw { detail: error.message };
      }
    },
  );

  return client;
}

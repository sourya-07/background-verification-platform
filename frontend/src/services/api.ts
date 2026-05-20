import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  // Surfaced loudly during local dev so a missing .env doesn't silently
  // ship the app pointing at the wrong host.
  throw new Error(
    "VITE_API_BASE_URL is not set. Copy frontend/.env.example to frontend/.env."
  );
}

/**
 * Centralized axios instance. Two behaviors worth knowing about:
 *
 * 1. A request interceptor injects the JWT on every call, pulled fresh
 *    from the zustand store so we don't keep a stale token cached.
 * 2. A response interceptor watches for 401s and force-logs the user
 *    out — usually means their token expired.
 */
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // Don't redirect from here — let the routes handle that. We just
      // drop the token so the next render flips to the login screen.
      useAuthStore.getState().logout();
    }
    return Promise.reject(err);
  }
);

/**
 * Standard response envelope returned by every JSON endpoint.
 * `data` is the resource payload; `errors` is only present on failures.
 */
export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
}

/**
 * Helper: pull `data` out of an envelope, throw if the server signaled
 * failure or omitted the field. Service methods use this so callers can
 * treat the network call as if it returned the payload directly.
 */
export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success || envelope.data === undefined) {
    throw new Error(envelope.message || "Request failed");
  }
  return envelope.data;
}

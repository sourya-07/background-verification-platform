import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

/**
 * Persisted auth store. Token + user object live in localStorage so a
 * page refresh doesn't drop the session.
 *
 * Note: we store the JWT in localStorage on purpose for this app. In a
 * higher-stakes context you'd want an httpOnly cookie instead, but that
 * requires a same-origin proxy or a more involved CORS setup.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "bgv.auth" }
  )
);

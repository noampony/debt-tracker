import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";

import { celebrate } from "../lib/confetti";

const API_BASE = "/api";
const AUTH_STORAGE_KEY = "debt-tracker:auth";

export type AuthUser = { id: string; email: string };

type StoredAuth = { token: string; user: AuthUser };

export type AuthState = {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed !== null &&
      typeof parsed === "object" &&
      "token" in parsed &&
      typeof (parsed as Record<string, unknown>).token === "string" &&
      "user" in parsed &&
      typeof (parsed as Record<string, unknown>).user === "object" &&
      (parsed as Record<string, unknown>).user !== null
    ) {
      const user = (parsed as { user: Record<string, unknown> }).user;
      if (typeof user.id === "string" && typeof user.email === "string") {
        return parsed as StoredAuth;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function writeStoredAuth(auth: StoredAuth | null): void {
  try {
    if (auth) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable — ignore
  }
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [stored, setStored] = useState<StoredAuth | null>(readStoredAuth);

  // Fire confetti on page load for users who are already logged in via a saved session.
  useEffect(() => {
    if (stored) celebrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function persist(auth: StoredAuth | null) {
    writeStoredAuth(auth);
    setStored(auth);
  }

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const body = (await res.json()) as { token?: string; user?: AuthUser; error?: string };

    if (!res.ok) {
      throw new Error(body.error ?? "Login failed");
    }

    persist({ token: body.token!, user: body.user! });
    celebrate();
  }, []);

  const register = useCallback(async (email: string, password: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const body = (await res.json()) as { token?: string; user?: AuthUser; error?: string };

    if (!res.ok) {
      throw new Error(body.error ?? "Registration failed");
    }

    persist({ token: body.token!, user: body.user! });
    celebrate();
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    const currentToken = stored?.token;
    // Clear local state immediately so the UI responds without waiting for the network
    persist(null);
    if (currentToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${currentToken}` },
        });
      } catch {
        // Best-effort — token version is incremented server-side if the request arrives
      }
    }
  }, [stored?.token]);

  return (
    <AuthContext.Provider
      value={{
        token: stored?.token ?? null,
        user: stored?.user ?? null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}


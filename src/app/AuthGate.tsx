import { useMemo } from "react";

import { useAuth } from "../auth/AuthContext";
import { AuthPage } from "../auth/AuthPage";
import { App } from "./App";
import { createApiDebtRepository } from "../storage/apiDebtRepository";

export function AuthGate() {
  const { token, user, logout } = useAuth();

  const repository = useMemo(
    () => (token ? createApiDebtRepository(token, logout) : null),
    // logout is stable via useCallback in AuthProvider; token changes on sign-in/sign-out
    [token, logout],
  );

  if (!token || !user || !repository) {
    return <AuthPage />;
  }

  return <App repository={repository} userEmail={user.email} onLogout={logout} />;
}


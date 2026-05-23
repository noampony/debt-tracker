import { type FormEvent, useState } from "react";

import { ui } from "../i18n/he";
import { useAuth } from "./AuthContext";
import { Button } from "../components/primitives/Button";
import { Card } from "../components/primitives/Card";
import { TextInput } from "../components/primitives/TextInput";

type AuthMode = "login" | "register";

const SERVER_ERROR_MAP: Record<string, string> = {
  "Invalid email or password": ui.auth.errorInvalidCredentials,
  "Email already registered": ui.auth.errorEmailTaken,
};

function mapServerError(message: string): string {
  return SERVER_ERROR_MAP[message] ?? ui.auth.errorGeneric;
}

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";

  function switchMode() {
    setMode(isLogin ? "register" : "login");
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      setError(mapServerError(message));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-viewport">
      <div className="auth-shell">
        <header className="auth-header">
          <img className="app-logo auth-logo" src="/debt-tracker-logo.png" alt="" aria-hidden="true" />
          <h1>{ui.app.title}</h1>
          <p>{ui.app.subtitle}</p>
        </header>

        <Card>
          <form className="form-stack" onSubmit={handleSubmit} noValidate>
            <div className="form-heading">
              <h2>{isLogin ? ui.auth.loginTitle : ui.auth.registerTitle}</h2>
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}

            <TextInput
              label={ui.auth.emailLabel}
              type="email"
              value={email}
              placeholder={ui.auth.emailPlaceholder}
              autoComplete={isLogin ? "email" : "email"}
              dir="ltr"
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              required
            />

            <TextInput
              label={ui.auth.passwordLabel}
              type="password"
              value={password}
              placeholder={ui.auth.passwordPlaceholder}
              autoComplete={isLogin ? "current-password" : "new-password"}
              dir="ltr"
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              required
            />

            <Button type="submit" disabled={isSubmitting}>
              {isLogin ? ui.auth.loginButton : ui.auth.registerButton}
            </Button>

            <p className="auth-toggle">
              <button
                type="button"
                className="auth-toggle-button"
                onClick={switchMode}
                disabled={isSubmitting}
              >
                {isLogin ? ui.auth.switchToRegister : ui.auth.switchToLogin}
              </button>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

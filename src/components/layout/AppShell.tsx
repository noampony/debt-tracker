import type { PropsWithChildren } from "react";
import { ui } from "../../i18n/he";
import { Button } from "../primitives/Button";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  userEmail?: string;
  onLogout?: () => void;
}>;

export function AppShell({ title, subtitle, userEmail, onLogout, children }: AppShellProps) {
  return (
    <div className="app-viewport">
      <div className="app-shell">
        <header className="app-header">
          <div className="app-brand">
            <img className="app-logo app-header-logo" src="/debt-tracker-logo.png" alt="" aria-hidden="true" />
            <div className="app-brand-text">
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
          </div>
          {userEmail && onLogout && (
            <div className="app-header-user">
              <span className="app-header-email">{userEmail}</span>
              <Button
                type="button"
                variant="ghost"
                className="app-header-logout"
                onClick={onLogout}
              >
                {ui.auth.logoutButton}
              </Button>
            </div>
          )}
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

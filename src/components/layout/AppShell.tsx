import type { PropsWithChildren } from "react";

type AppShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
}>;

export function AppShell({ title, subtitle, children }: AppShellProps) {
  return (
    <div className="app-viewport">
      <div className="app-shell">
        <header className="app-header">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

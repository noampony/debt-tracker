import { useCallback, useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

/** Browser-chrome color per theme; kept in sync with the inline script in index.html. */
const THEME_COLOR: Record<Theme, string> = {
  light: "#1d4ed8",
  dark: "#15315e",
};

/** The theme the user explicitly chose, or null if they are following the system. */
export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

export function getSystemTheme(): Theme {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

/**
 * Apply a theme to the document (data-theme attribute + browser chrome color).
 * Pass persist=true only for an explicit user choice so that, otherwise, the app
 * keeps following the system setting.
 */
export function applyTheme(theme: Theme, persist = false): void {
  document.documentElement.setAttribute("data-theme", theme);

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLOR[theme]);
  }

  if (persist) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (e.g. private mode); the in-memory theme still applies.
    }
  }
}

/**
 * Reactive theme state. Reflects the resolved theme, persists explicit toggles,
 * and follows live system changes while the user has not chosen explicitly.
 */
export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(() => resolveTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const query = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!query) return;

    const onChange = () => {
      if (!getStoredTheme()) {
        setTheme(getSystemTheme());
      }
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === "dark" ? "light" : "dark";
      applyTheme(next, true);
      return next;
    });
  }, []);

  return { theme, toggle };
}

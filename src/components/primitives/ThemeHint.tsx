import { useState } from "react";

import { ui } from "../../i18n/he";

// TODO(2026-07-12): DELETE this theme-hint popup — it is temporary.
// A 2-week coachmark introducing the dark/light theme toggle. On/after the date
// above it stops rendering on its own (see the guard in ThemeHint()). Once the
// date has passed, remove this dead code entirely:
//   1. Delete this file (src/components/primitives/ThemeHint.tsx).
//   2. Remove the `ThemeHint` import and the <ThemeHint /> render in
//      src/components/primitives/ThemeToggle.tsx.
//   3. Remove the `hint` and `hintDismiss` strings from `ui.theme` in
//      src/i18n/he.ts.
//   4. Remove the matching entry in docs/TODO.md ("Scheduled Removals").
const HINT_END = new Date("2026-07-12T00:00:00Z");

/**
 * Small temporary popup pointing at the theme toggle. Renders nothing once
 * expired (HINT_END). Clicking X hides it for the current session only —
 * it reappears on the next page load until the expiry date is reached.
 * Must be placed inside a positioned (relative/absolute) container.
 */
export function ThemeHint() {
  const [hidden, setHidden] = useState(() => new Date() >= HINT_END);

  if (hidden) return null;

  return (
    <div className="theme-hint" role="note">
      <span className="theme-hint-text">{ui.theme.hint}</span>
      <button
        type="button"
        className="theme-hint-dismiss"
        onClick={() => setHidden(true)}
        aria-label={ui.theme.hintDismiss}
      >
        ✕
      </button>
    </div>
  );
}

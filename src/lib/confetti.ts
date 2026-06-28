import confetti from "canvas-confetti";

// TODO(2026-07-19): DELETE the login confetti celebration — it is temporary.
// This was a 3-week launch celebration for the new UI. On/after the date above
// it stops firing on its own (see the guard in celebrate()). Once the date has
// passed, remove this dead code entirely:
//   1. Delete this file (src/lib/confetti.ts).
//   2. Remove the `celebrate` import and both celebrate() calls in
//      src/auth/AuthContext.tsx (login + register success paths).
//   3. Uninstall the now-unused deps:
//        npm uninstall canvas-confetti @types/canvas-confetti
//   4. Remove the matching entry in docs/TODO.md ("Scheduled Removals").
const CELEBRATION_END = new Date("2026-07-19T00:00:00Z");

/**
 * Fire a short, celebratory confetti burst.
 *
 * Tuned for mobile-first usage: modest particle counts keep it smooth on
 * phones, and the bursts come from the lower-left and lower-right corners so
 * the confetti arcs up into view regardless of screen size. canvas-confetti
 * renders to its own full-viewport canvas appended to <body>, so the animation
 * keeps running even after the triggering component unmounts (e.g. when the
 * login screen is replaced by the app).
 *
 * Respects the user's reduced-motion preference — it renders nothing when the
 * OS/browser requests reduced motion.
 */
export function celebrate(): void {
  // Temporary launch celebration — stops firing automatically once expired.
  if (new Date() >= CELEBRATION_END) return;

  // Shared tuning: high start velocity for a strong launch, low gravity plus a
  // long lifetime (ticks) and slow decay so the confetti hangs in the air and
  // drifts down slowly rather than dropping out of view quickly.
  const base = {
    startVelocity: 70,
    ticks: 400,
    gravity: 0.6,
    decay: 0.93,
    scalar: 1.1,
    disableForReducedMotion: true,
  } as const;

  const fire = (originX: number, angle: number) => {
    confetti({
      ...base,
      particleCount: 150,
      spread: 95,
      origin: { x: originX, y: 1 },
      angle,
    });
  };

  // Two strong cannons from the bottom corners, arcing toward the centre...
  fire(0.1, 60);
  fire(0.9, 120);

  // ...plus a wide central fountain for extra volume.
  confetti({
    ...base,
    particleCount: 140,
    spread: 130,
    origin: { x: 0.5, y: 1 },
    angle: 90,
  });
}

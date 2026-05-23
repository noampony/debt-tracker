import { type KeyboardEvent, type PropsWithChildren, useCallback, useEffect, useRef } from "react";

/**
 * Accessible dialog component.
 *
 * - Moves focus to the first focusable child when opened.
 * - Returns focus to the previously-focused element when closed.
 * - Traps Tab/Shift+Tab focus cycles within the dialog.
 * - Closes on Escape key.
 */

const FOCUSABLE_QUERY = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "a[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type DialogProps = PropsWithChildren<{
  /** Whether the dialog is currently open. */
  isOpen: boolean;
  /** The id of the element that labels the dialog (its title). */
  titleId: string;
  /** Called when the dialog should close (Escape key or cancel action). */
  onClose: () => void;
}>;

export function Dialog({ isOpen, titleId, onClose, children }: DialogProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // Move focus into the dialog when opened; return focus when closed.
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = (document.activeElement as HTMLElement) ?? null;
      const firstFocusable = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_QUERY);
      if (firstFocusable) {
        firstFocusable.focus();
      } else {
        containerRef.current?.focus();
      }
    } else {
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [isOpen]);

  // Close on Escape; trap Tab/Shift+Tab within the dialog.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;

      const focusables = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_QUERY),
      );

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === first || active === containerRef.current) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || active === containerRef.current) {
          event.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="dialog-backdrop" role="presentation">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        {children}
      </div>
    </div>
  );
}


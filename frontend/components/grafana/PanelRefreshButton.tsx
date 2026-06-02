"use client";

import { RefreshCw } from "lucide-react";

type Props = {
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

/** Icon-only panel refresh — no spin / no loading state on the control */
export function PanelRefreshButton({ onClick, disabled, ariaLabel = "Refresh panel data" }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-[var(--gf-panel-border)] bg-[var(--gf-panel-inner)] text-[var(--gf-text-muted)] transition-[color,background-color,border-color,opacity] hover:border-[var(--gf-accent)]/50 hover:text-[var(--gf-accent)] disabled:pointer-events-none disabled:opacity-45"
    >
      <RefreshCw className="size-3.5" aria-hidden strokeWidth={2.25} />
    </button>
  );
}

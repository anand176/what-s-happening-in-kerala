import type { ReactNode } from "react";

export function GrafanaMiniPanel({
  title,
  badge,
  actions,
  id,
  children,
}: {
  title: string;
  badge?: ReactNode;
  actions?: ReactNode;
  id?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="gf-panel flex min-w-0 flex-1 flex-col scroll-mt-[120px]">
      <div className="flex items-center gap-2 border-b border-[var(--gf-panel-border)] bg-black/20 px-3 py-2">
        <span className="min-w-0 flex-1 truncate font-mono text-[0.68rem] font-semibold tracking-widest text-[var(--gf-text)] uppercase">
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          {badge}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}

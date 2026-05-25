import type { ReactNode } from "react";

export function GrafanaPanel({
  id,
  title,
  subtitle,
  rightSlot,
  children,
  className = "",
  contentClassName = "",
}: {
  id?: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <section id={id} className={`pin-card ${className}`.trim()}>
      <header className="pin-card-header flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="pin-card-title">{title}</h2>
          {subtitle && <p className="pin-card-subtitle">{subtitle}</p>}
        </div>
        {rightSlot && <div className="shrink-0 ml-3">{rightSlot}</div>}
      </header>
      <div className={`pin-card-body ${contentClassName}`.trim()}>{children}</div>
    </section>
  );
}

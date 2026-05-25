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
    <section
      id={id}
      className={`gf-panel kt-animate-in ${className}`.trim()}
    >
      <header className="gf-panel-header">
        <span className="gf-panel-accent-bar" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="gf-panel-heading">{title}</h2>
          {subtitle ? (
            <p className="gf-panel-subheading">{subtitle}</p>
          ) : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </header>
      <div className={`gf-panel-body ${contentClassName}`.trim()}>{children}</div>
    </section>
  );
}

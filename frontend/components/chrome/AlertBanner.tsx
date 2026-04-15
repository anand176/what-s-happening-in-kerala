"use client";

const DEFAULT_TICKER =
  "IMD issues Yellow Alert for heavy rainfall in Wayanad, Idukki, and Malappuram districts • Kochi Metro extends services till midnight on weekends • Thrissur Pooram date announced for May 2026 • KSRTC launches new AC bus service on Thiruvananthapuram–Kochi route";

export function AlertBanner({ text = DEFAULT_TICKER }: { text?: string }) {
  const doubled = `${text} \u00A0\u00A0\u2022\u00A0\u00A0 ${text}`;
  return (
    <div
      className="flex items-center gap-2 overflow-hidden border-b border-[var(--gf-panel-border)] px-3 py-2 font-mono text-[0.72rem] text-[var(--gf-text)] md:px-5"
      style={{ background: "var(--gf-ticker-bg)" }}
    >
      <span
        className="shrink-0 rounded-sm px-1.5 py-0.5 text-[0.58rem] font-bold tracking-wider text-[#0b0f14]"
        style={{ background: "var(--gf-warn)" }}
      >
        {"\u26A0\uFE0F"} ALERT
      </span>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="kt-ticker-track whitespace-nowrap">
          <span className="inline-block pr-16">{doubled}</span>
          <span className="inline-block pr-16">{doubled}</span>
        </div>
      </div>
    </div>
  );
}

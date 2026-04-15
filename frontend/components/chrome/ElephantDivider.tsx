export function ElephantDivider({ emoji = "\u{1F418}" }: { emoji?: string }) {
  return (
    <div
      className="relative my-6 text-center text-xl"
      style={{ color: "var(--gf-text-muted)" }}
    >
      <span
        className="relative z-[1] inline-block px-3"
        style={{ background: "var(--gf-page)" }}
      >
        {emoji}
      </span>
      <span
        className="pointer-events-none absolute top-1/2 right-0 left-0 h-px -translate-y-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--gf-panel-border), var(--gf-accent), var(--gf-panel-border), transparent)",
        }}
        aria-hidden
      />
    </div>
  );
}

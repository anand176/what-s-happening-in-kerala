export function SectionHeader({
  emoji,
  title,
  mlSubtitle,
  badge,
  variant = "light",
}: {
  emoji: string;
  title: string;
  mlSubtitle: string;
  badge?: string;
  variant?: "light" | "dark";
}) {
  const titleColor = variant === "dark" ? "var(--kt-gold)" : "var(--kt-green)";
  const subColor =
    variant === "dark" ? "var(--kt-cream-dark)" : "var(--kt-brown-light)";

  return (
    <div className="mb-4 flex items-center gap-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base shadow-[0_0_12px_rgba(249,168,37,0.5)]"
        style={{
          background: "var(--kt-gold)",
          color: "var(--kt-brown)",
        }}
      >
        {emoji}
      </div>
      <div className="min-w-0 flex-1">
        <h2
          className="font-[family-name:var(--font-playfair)] text-[1.15rem] font-semibold md:text-[1.3rem]"
          style={{ color: titleColor }}
        >
          {title}
        </h2>
        <span
          className="font-ml-serif text-[0.7rem]"
          style={{ color: subColor, opacity: variant === "dark" ? 0.85 : 1 }}
        >
          {mlSubtitle}
        </span>
      </div>
      {badge ? (
        <span
          className="kt-pulse-live shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white"
          style={{ background: "var(--kt-red)" }}
        >
          {badge}
        </span>
      ) : null}
    </div>
  );
}

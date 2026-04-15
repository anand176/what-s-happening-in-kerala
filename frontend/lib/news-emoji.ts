export function emojiForNewsTitle(title: string): string {
  const t = title.toLowerCase();
  if (
    t.includes("weather") ||
    t.includes("rain") ||
    t.includes("flood") ||
    t.includes("heat")
  ) {
    return "\u{1F327}\uFE0F";
  }
  if (
    t.includes("police") ||
    t.includes("arrest") ||
    t.includes("crime") ||
    t.includes("court")
  ) {
    return "\u{1F6A8}";
  }
  if (
    t.includes("sport") ||
    t.includes("cricket") ||
    t.includes("football") ||
    t.includes("olymp")
  ) {
    return "\u26BD";
  }
  if (
    t.includes("health") ||
    t.includes("hospital") ||
    t.includes("doctor") ||
    t.includes("medical")
  ) {
    return "\u{1F48A}";
  }
  if (
    t.includes("politic") ||
    t.includes("election") ||
    t.includes("minister") ||
    t.includes("assembly")
  ) {
    return "\u{1F3DB}\uFE0F";
  }
  if (
    t.includes("bus") ||
    t.includes("metro") ||
    t.includes("road") ||
    t.includes("train")
  ) {
    return "\u{1F68C}";
  }
  return "\u{1F4F0}";
}

/**
 * Translucent tint of any CSS colour.
 *
 * Appending hex alpha (`${color}22`) only works when `color` is a literal hex
 * string — for a `var(--token)` it produces invalid CSS and the declaration is
 * dropped, so the tint silently disappears. `color-mix` works for both.
 */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

/** Thumbnail glyph for carousel + slides list. */
export function layoutGlyphForList(layout: string): string {
  const m: Record<string, string> = {
    headline: "H",
    chat: "💬",
    stat: "#",
    list: "≡",
    terminal: "▶",
    title: "T",
    content: "¶",
    bullets: "•",
    quote: "\u201c",
    split: "◧",
    cases: "▦",
    financial: "€",
    team: "👥",
    pillars: "☰",
    grid: "▤",
    comparison: "⇌",
    process: "→",
    packages: "◈",
    ending: "✦",
    blank: "○",
  };
  return m[layout] ?? "?";
}

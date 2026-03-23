/** Converts `[label](url)` → `label` for plain rendering. */
export function stripMarkdownLinks(s: string): string {
  return s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

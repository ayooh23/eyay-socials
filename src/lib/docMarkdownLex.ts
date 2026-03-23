import { marked } from "marked";
import type { Token } from "marked";

/** Lex markdown (GFM) into tokens for doc preview + PDF. */
export function lexDocMarkdown(src: string): Token[] {
  const out = marked.lexer(src.trim() || "—");
  return out as Token[];
}

export type Layout = "headline" | "chat" | "stat" | "list" | "terminal";
export type ChatSpeed = "normal" | "fast" | "slow";
export type ThemeKey = "dark" | "light" | "blue" | "cream" | "midnight" | "red";
export type Alignment = "left" | "center" | "right";

export interface Slide {
  id: string;
  layout: Layout;
  eyebrow: string;
  headline: string;
  body: string;
  m1: string;
  m2: string;
  m3: string;
  sn1: string;
  sn2: string;
  chatSpeed: ChatSpeed;
  s1n: string;
  s1l: string;
  s2n: string;
  s2l: string;
  l1: string;
  l2: string;
  l3: string;
  l4: string;
  term: string;
  cta: string;
  /** Per-slide color palette (export + preview use this unless themeKey override is passed). */
  theme: ThemeKey;
  /** Per-slide text alignment for supported layouts. */
  align: Alignment;
}

export interface GlobalStyle {
  size: number;
  showTag: boolean;
  showNum: boolean;
}

export interface ThemeTokens {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  bIn: string;
  bInT: string;
  bOut: string;
  bOutT: string;
  term: string;
  termT: string;
}

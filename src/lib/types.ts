export type Layout = "headline" | "chat" | "stat" | "list" | "terminal";
export type ChatSpeed = "normal" | "fast" | "slow";
export type ThemeKey = "dark" | "light" | "blue" | "cream" | "midnight" | "red";
export type Alignment = "left" | "center" | "right";
/** Which msg-3 variant is shown in the slide (A/B/C). */
export type M3Pick = 0 | 1 | 2;

export interface ChatRow {
  id: string;
  role: "in" | "out";
  text: string;
}

export interface Slide {
  id: string;
  layout: Layout;
  eyebrow: string;
  headline: string;
  body: string;
  m1: string;
  m2: string;
  m3: string;
  /** Incoming (Sinyo) line shown right before the active A/B/C variant. */
  m3Lead: string;
  /** Alternate lines for msg 3; only `m3Pick` is shown. */
  m3b: string;
  m3c: string;
  m3Pick: M3Pick;
  sn1: string;
  sn2: string;
  /** When non-empty (with text), replaces classic m1/m2/m3 fields for chat layout. */
  chatRows: ChatRow[];
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

export type SlidesLayout =
  | "title"
  | "content"
  | "bullets"
  | "quote"
  | "stat"
  | "split"
  | "cases"
  | "terminal"
  | "chat"
  | "financial"
  | "team"
  | "pillars"
  | "grid"
  | "comparison"
  | "process"
  | "packages"
  | "ending"
  | "blank";

/** One row in the deck "financial" table (proposal investment-style). */
export interface SlidesFinancialRow {
  id: string;
  label: string;
  description: string;
  qty: string;
  price: string;
}

export interface GridItem {
  id: string;
  title: string;
  description: string;
}

export interface CompRow {
  id: string;
  label: string;
  cells: string[];
}

export interface PackageCard {
  id: string;
  name: string;
  price: string;
  duration: string;
  items: string;
  recommended: boolean;
}

/** 16:9 deck slide (Slides tab); separate from carousel `Slide`. */
export interface SlidesSlide {
  id: string;
  layout: SlidesLayout;
  eyebrow: string;
  headline: string;
  body: string;
  s1n: string;
  s1l: string;
  s2n: string;
  s2l: string;
  l1: string;
  l2: string;
  l3: string;
  l4: string;
  /** Split / cases layout: label inside image placeholder when no upload. */
  imageHint: string;
  /** Split / cases layout: optional uploaded image (data URL). */
  splitImageDataUrl: string;
  /** Terminal / cases layout. */
  term: string;
  /** Terminal prompt label (shown before the command, defaults to "eyay"). */
  termPrompt: string;
  m1: string;
  m2: string;
  m3: string;
  m3Lead: string;
  m3b: string;
  m3c: string;
  m3Pick: M3Pick;
  sn1: string;
  sn2: string;
  chatRows: ChatRow[];
  chatSpeed: ChatSpeed;
  /** Cases layout: client name. */
  caseClient: string;
  /** Cases layout: key result / metric. */
  caseResult: string;
  financialRows: SlidesFinancialRow[];
  financialVatNote: string;
  financialPaymentTerms: string;
  /** Pillars layout (3 columns). */
  p1title: string;
  p1body: string;
  p2title: string;
  p2body: string;
  p3title: string;
  p3body: string;
  /** Grid layout tiles. */
  gridItems: GridItem[];
  /** Comparison table. */
  compColumns: string[];
  compRows: CompRow[];
  compHighlight: number;
  /** Package cards. */
  packageCards: PackageCard[];
  cta: string;
  theme: ThemeKey;
  align: Alignment;
}

export interface GlobalStyle {
  size: number;
  showTag: boolean;
  showNum: boolean;
}

/** Minimal fields for slide list thumbnails (carousel + slides). */
export type SlideListItem = {
  id: string;
  theme: ThemeKey;
  layout: string;
  headline: string;
};

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
  /** Solid hex color for strokes/borders (PDF-safe, no rgba). */
  stroke: string;
}

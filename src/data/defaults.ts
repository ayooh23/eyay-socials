import type { Slide } from "@/lib/types";

export function newSlideId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createSlide(partial: Partial<Slide> = {}): Slide {
  return {
    id: newSlideId(),
    layout: "headline",
    eyebrow: "",
    headline: "",
    body: "",
    m1: "",
    m2: "",
    m3: "",
    sn1: "Sinyo",
    sn2: "Ayu",
    chatSpeed: "normal",
    s1n: "",
    s1l: "",
    s2n: "",
    s2l: "",
    l1: "",
    l2: "",
    l3: "",
    l4: "",
    term: "",
    cta: "eyay.studio",
    theme: "dark",
    align: "left",
    ...partial,
  };
}

export const DEFAULT_SLIDES: Slide[] = [
  createSlide({
    layout: "headline",
    eyebrow: "eyay · amsterdam",
    headline: "Your idea\nfrom this morning,\nbuilt today.",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "chat",
    eyebrow: "this is how it starts",
    m1: "Ey ay",
    m2: "What if we built…",
    m3: "…something that just works",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "stat",
    eyebrow: "the numbers",
    headline: "Two people.\nTen-person output.",
    s1n: "2×",
    s1l: "faster iteration",
    s2n: "10×",
    s2l: "output",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "list",
    eyebrow: "how we work",
    headline: "AI-native,\nend-to-end.",
    l1: "AI runs through every stage",
    l2: "No handoffs — you brief us, we build",
    l3: "Clean code, easy to maintain",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "terminal",
    eyebrow: "loading…",
    term: "where ideas get built today",
    cta: "eyay.studio",
  }),
];

export const DEFAULT_GLOBAL_STYLE = {
  size: 88,
  showTag: true,
  showNum: true,
};

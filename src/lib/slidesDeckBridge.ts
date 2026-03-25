import type { Layout, Slide, SlidesSlide } from "@/lib/types";

/** Map deck slide to carousel `Slide` for shared helpers (e.g. `getChatBubbleList`). */
export function slidesSlideToCarouselSlide(s: SlidesSlide): Slide {
  const layout: Layout =
    s.layout === "chat"
      ? "chat"
      : s.layout === "terminal"
        ? "terminal"
        : "headline";

  return {
    id: s.id,
    layout,
    eyebrow: s.eyebrow,
    headline: s.headline,
    body: s.body,
    m1: s.m1,
    m2: s.m2,
    m3: s.m3,
    m3Lead: s.m3Lead,
    m3b: s.m3b,
    m3c: s.m3c,
    m3Pick: s.m3Pick,
    sn1: s.sn1,
    sn2: s.sn2,
    chatRows: s.chatRows ?? [],
    chatSpeed: s.chatSpeed ?? "normal",
    s1n: s.s1n,
    s1l: s.s1l,
    s2n: s.s2n,
    s2l: s.s2l,
    l1: s.l1,
    l2: s.l2,
    l3: s.l3,
    l4: s.l4,
    term: s.term,
    cta: s.cta,
    theme: s.theme,
    align: s.align,
  };
}

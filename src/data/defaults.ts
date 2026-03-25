import { newChatRowId } from "@/lib/chatSlide";
import type { Slide, SlidesSlide, GridItem, CompRow, PackageCard } from "@/lib/types";

export function newSlideId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newFinancialRowId(): string {
  return `fr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newGridItemId(): string {
  return `gi-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newCompRowId(): string {
  return `cr-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function newPackageCardId(): string {
  return `pk-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
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
    m3Lead: "",
    m3b: "",
    m3c: "",
    m3Pick: 0,
    sn1: "Sinyo",
    sn2: "Ayu",
    chatRows: [],
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
    eyebrow: "eyay \u00b7 amsterdam",
    headline: "Your idea\nfrom this morning,\nbuilt today.",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "chat",
    eyebrow: "this is how it starts",
    m1: "Ey ay",
    m2: "What if we built\u2026",
    m3Lead: "Yeah \u2014 I\u2019m thinking\u2026",
    m3: "\u2026something that just works",
    m3b: "\u2026ship it this week",
    m3c: "\u2026no busywork",
    m3Pick: 0,
    chatRows: [
      { id: newChatRowId(), role: "in", text: "Ey ay" },
      { id: newChatRowId(), role: "out", text: "What if we built\u2026" },
      { id: newChatRowId(), role: "in", text: "Yeah \u2014 I\u2019m thinking\u2026" },
      { id: newChatRowId(), role: "in", text: "\u2026something that just works" },
    ],
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "stat",
    eyebrow: "the numbers",
    headline: "Two people.\nTen-person output.",
    s1n: "2\u00d7",
    s1l: "faster iteration",
    s2n: "10\u00d7",
    s2l: "output",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "list",
    eyebrow: "how we work",
    headline: "AI-native,\nend-to-end.",
    l1: "AI runs through every stage",
    l2: "No handoffs \u2014 you brief us, we build",
    l3: "Clean code, easy to maintain",
    cta: "eyay.studio",
  }),
  createSlide({
    layout: "terminal",
    eyebrow: "loading\u2026",
    term: "where ideas get built today",
    cta: "eyay.studio",
  }),
];

export const DEFAULT_GLOBAL_STYLE = {
  size: 88,
  showTag: true,
  showNum: true,
  showDots: true,
};

export function createSlidesSlide(partial: Partial<SlidesSlide> = {}): SlidesSlide {
  return {
    id: newSlideId(),
    layout: "title",
    eyebrow: "",
    headline: "",
    body: "",
    s1n: "",
    s1l: "",
    s2n: "",
    s2l: "",
    l1: "",
    l2: "",
    l3: "",
    l4: "",
    imageHint: "Image",
    splitImageDataUrl: "",
    term: "",
    termPrompt: "eyay",
    m1: "",
    m2: "",
    m3: "",
    m3Lead: "",
    m3b: "",
    m3c: "",
    m3Pick: 0,
    sn1: "Sinyo",
    sn2: "Ayu",
    chatRows: [],
    chatSpeed: "normal",
    caseClient: "",
    caseResult: "",
    financialRows: [],
    financialVatNote: "",
    financialPaymentTerms: "",
    p1title: "",
    p1body: "",
    p2title: "",
    p2body: "",
    p3title: "",
    p3body: "",
    gridItems: [],
    compColumns: [],
    compRows: [],
    compHighlight: -1,
    packageCards: [],
    cta: "eyay.studio",
    theme: "dark",
    align: "left",
    ...partial,
  };
}

export const DEFAULT_SLIDES_DECK: SlidesSlide[] = [
  createSlidesSlide({
    layout: "title",
    eyebrow: "eyay \u00b7 deck",
    headline: "Slides mode",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "content",
    eyebrow: "overview",
    headline: "More room for narrative",
    body: "This slide shows how longer body copy reads on 16:9. Use it for context, constraints, or a short story before you dive into bullets or data.\n\nKeep paragraphs tight: two or three sentences each. Export stays crisp at 1920\u00d71080 for decks and PDFs.",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "bullets",
    eyebrow: "agenda",
    headline: "Today\u2019s session",
    l1: "Goals & context \u2014 what we\u2019re solving",
    l2: "Approach \u2014 how we\u2019ll work together",
    l3: "Timeline & milestones",
    l4: "Decisions & next steps",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "quote",
    headline: "Build the thing that makes the other things obvious.",
    body: "\u2014 Team note",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "stat",
    eyebrow: "signal",
    headline: "Numbers that matter",
    s1n: "10\u00d7",
    s1l: "faster iteration",
    s2n: "2",
    s2l: "people, end-to-end",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "split",
    headline: "Visual + narrative",
    body: "Supporting text beside the image placeholder.",
    imageHint: "Image",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "cases",
    eyebrow: "Service Design \u00b7 Internal Tool",
    headline: "d+o",
    caseClient: "OLVG Amsterdam",
    body: "Emergency referral tool for ER physicians \u2014 connecting vulnerable patients to 180+ social care services at discharge. No login, no patient data, usable in under 60 seconds.",
    caseResult: "Service discovery in under 30 seconds",
    term: "deployed \u2014 filtering real data, approved by clinical team",
    chatRows: [
      { id: newChatRowId(), role: "in", text: "We need to refer this patient \u2014 now" },
      { id: newChatRowId(), role: "out", text: "Open d+o, filter by need, tap a pin" },
      { id: newChatRowId(), role: "in", text: "Done. Under 30 seconds." },
    ],
    imageHint: "d+o interface",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "cases",
    eyebrow: "AI / ML \u00b7 Product",
    headline: "AI route planner",
    caseClient: "Logistics startup",
    body: "Internal copilot that replaced manual route-planning with LLM-driven suggestions. Built and validated in four weeks.",
    caseResult: "70% less manual planning time",
    term: "4-week build \u2014 from brief to production",
    chatRows: [
      { id: newChatRowId(), role: "in", text: "Our dispatchers spend hours on routes" },
      { id: newChatRowId(), role: "out", text: "What if AI drafts the route and they just approve?" },
      { id: newChatRowId(), role: "in", text: "Ship it." },
    ],
    imageHint: "Route planner UI",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "blank",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "financial",
    eyebrow: "investment",
    headline: "Summary",
    financialRows: [
      {
        id: newFinancialRowId(),
        label: "Discovery & design",
        description: "Workshops, UX, and direction",
        qty: "1",
        price: "\u20ac8,000",
      },
      {
        id: newFinancialRowId(),
        label: "Build \u2014 phase 1",
        description: "MVP scope as agreed",
        qty: "1",
        price: "\u20ac24,000",
      },
      {
        id: newFinancialRowId(),
        label: "Retainer",
        description: "Monthly product support",
        qty: "3 mo",
        price: "\u20ac4,500/mo",
      },
    ],
    financialVatNote: "VAT and local taxes as applicable.",
    financialPaymentTerms: "50% to start, 50% on delivery unless otherwise agreed.",
    cta: "eyay.studio",
  }),
  createSlidesSlide({
    layout: "ending",
    eyebrow: "thank you",
    align: "center",
    headline: "Let\u2019s build the next thing",
    body: "Thanks for your time.\n\neyay is a small product studio in Amsterdam. We partner end-to-end \u2014 from idea to shipped software \u2014 with AI-native workflows and no handoffs.\n\nhello@eyay.studio\nhttps://eyay.studio\nAmsterdam, NL",
    cta: "eyay.studio",
  }),
];

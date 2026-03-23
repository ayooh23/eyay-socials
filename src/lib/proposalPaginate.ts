import { PROPOSAL_SECTION_ORDER } from "./proposalDefaults";
import type {
  DeliverableItem,
  HowWeWorkSection,
  ProjectScopeSection,
  Proposal,
  ProposalPageModel,
  ScopeRenderBlock,
  SectionPagePayload,
  SectionType,
} from "./proposalTypes";

const CHARS_PER_LINE = 72;
const LINE_PX = 13 * 1.7;
/** Content area under section header (~1123 - margins - header - footer) */
const MAX_CONTENT_PX = 880;

export const SECTION_TITLES: Record<SectionType, string> = {
  cover: "Cover",
  about: "About the project",
  "about-eya": "About eyay",
  "project-scope": "Product & scope",
  deliverables: "What we’ll build",
  "how-we-work": "How we work",
  timeline: "Timeline",
  "pricing-options": "Investment",
  investment: "eyay pricelist",
  team: "Team",
  decisions: "Decisions needed",
  "next-steps": "Next steps",
  terms: "Terms",
};

function estimateTextHeightPx(text: string): number {
  if (!text.trim()) return 0;
  const hardLines = text.split("\n");
  let total = 0;
  for (const line of hardLines) {
    const wraps = Math.max(1, Math.ceil(line.length / CHARS_PER_LINE));
    total += wraps * LINE_PX;
  }
  return total;
}

function packParagraphs(fieldTexts: string[], maxPx: number): string[][] {
  const parts: string[] = [];
  for (const t of fieldTexts) {
    const trimmed = t.trim();
    if (!trimmed) continue;
    parts.push(trimmed);
  }
  if (parts.length === 0) return [["—"]];

  const pages: string[][] = [];
  let current: string[] = [];
  let used = 0;

  const flush = () => {
    if (current.length) {
      pages.push(current);
      current = [];
      used = 0;
    }
  };

  for (const p of parts) {
    const h = estimateTextHeightPx(p) + (current.length ? LINE_PX : 0);
    if (used + h > maxPx && current.length) {
      flush();
    }
    if (estimateTextHeightPx(p) > maxPx) {
      const words = p.split(/\s+/);
      let buf = "";
      for (const w of words) {
        const next = buf ? `${buf} ${w}` : w;
        if (estimateTextHeightPx(next) > maxPx && buf) {
          current.push(buf);
          used += estimateTextHeightPx(buf) + (current.length > 1 ? LINE_PX : 0);
          if (used > maxPx) {
            flush();
          }
          buf = w;
        } else {
          buf = next;
        }
      }
      if (buf) {
        const bh = estimateTextHeightPx(buf) + (current.length ? LINE_PX : 0);
        if (used + bh > maxPx && current.length) flush();
        current.push(buf);
        used += bh;
      }
      continue;
    }
    current.push(p);
    used += h;
  }
  flush();
  return pages.length ? pages : [["—"]];
}

function packDeliverablePages(
  intro: string,
  items: DeliverableItem[],
  maxPx: number,
): Array<{ intro: string; items: DeliverableItem[] }> {
  const included = items.filter((i) => i.included);
  const pages: Array<{ intro: string; items: DeliverableItem[] }> = [];
  let pageIntro = intro.trim();
  let bucket: DeliverableItem[] = [];
  let used = pageIntro ? estimateTextHeightPx(pageIntro) + 32 : 32;

  const flush = () => {
    pages.push({ intro: pageIntro, items: [...bucket] });
    pageIntro = "";
    bucket = [];
    used = 32;
  };

  for (const it of included) {
    const block = 26 + estimateTextHeightPx(it.label);
    if (used + block > maxPx && (bucket.length || pageIntro)) {
      flush();
    }
    if (!bucket.length && !pageIntro) used = 32;
    bucket.push(it);
    used += block;
  }
  if (bucket.length || pageIntro) flush();

  return pages.length ? pages : [{ intro: intro.trim(), items: included }];
}

function packPillarPages(
  pillars: HowWeWorkSection["pillars"],
  maxPx: number,
): HowWeWorkSection["pillars"][] {
  const pages: HowWeWorkSection["pillars"][] = [];
  let cur: HowWeWorkSection["pillars"] = [];
  let used = 0;
  for (const p of pillars) {
    const h =
      14 +
      estimateTextHeightPx(p.tag) +
      estimateTextHeightPx(p.headline) +
      estimateTextHeightPx(p.desc);
    if (used + h > maxPx && cur.length) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(p);
    used += h;
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [[]];
}

function flattenProjectScope(ps: ProjectScopeSection): ScopeRenderBlock[] {
  const blocks: ScopeRenderBlock[] = [];
  if (ps.productTitle.trim() || ps.productBody.trim()) {
    blocks.push({
      kind: "product",
      title: ps.productTitle.trim() || "Product",
      body: ps.productBody.trim() || "—",
    });
  }
  if (ps.audienceIntro.trim() || ps.audienceItems.length) {
    blocks.push({
      kind: "bullets",
      title: ps.audienceIntro.trim() || "Audience",
      intro: "",
      items: ps.audienceItems.map((x) => x.text).filter(Boolean),
    });
  }
  if (ps.flowIntro.trim() || ps.flowSteps.length) {
    blocks.push({
      kind: "flow",
      title: ps.flowIntro.trim() || "Flow",
      intro: "",
      steps: ps.flowSteps.map((s) => ({
        title: s.title,
        detail: s.detail,
      })),
    });
  }
  if (ps.mvpTitle.trim() || ps.mvpIntro.trim() || ps.mvpItems.length) {
    blocks.push({
      kind: "bullets",
      title: ps.mvpTitle.trim() || "MVP",
      intro: ps.mvpIntro.trim(),
      items: ps.mvpItems.map((x) => x.text).filter(Boolean),
    });
  }
  if (ps.v1Title.trim() || ps.v1Intro.trim() || ps.v1Items.length) {
    blocks.push({
      kind: "bullets",
      title: ps.v1Title.trim() || "V1 scope",
      intro: ps.v1Intro.trim(),
      items: ps.v1Items.map((x) => x.text).filter(Boolean),
    });
  }
  const extraTitle = ps.extraTitle ?? "";
  const extraDescription = ps.extraDescription ?? "";
  if (ps.extraEnabled && (extraTitle.trim() || extraDescription.trim())) {
    blocks.push({
      kind: "product",
      title: extraTitle.trim() || "Extra",
      body: extraDescription.trim() || "—",
    });
  }
  if (ps.outTitle.trim() || ps.outItems.length) {
    blocks.push({
      kind: "bullets",
      title: ps.outTitle.trim() || "Out of scope",
      intro: "",
      items: ps.outItems.map((x) => x.text).filter(Boolean),
    });
  }
  if (ps.engagementTitle.trim() || ps.engagementBody.trim()) {
    blocks.push({
      kind: "product",
      title: ps.engagementTitle.trim() || "Engagement",
      body: ps.engagementBody.trim() || "—",
    });
  }
  return blocks.length
    ? blocks
    : [{ kind: "product", title: "Scope", body: "—" } as ScopeRenderBlock];
}

function estimateScopeBlockHeight(b: ScopeRenderBlock): number {
  const titleH = 36;
  switch (b.kind) {
    case "product":
      return titleH + estimateTextHeightPx(b.body);
    case "bullets":
      return (
        titleH +
        estimateTextHeightPx(b.intro) +
        (b.intro.trim() ? LINE_PX : 0) +
        b.items.length * (LINE_PX + 4)
      );
    case "flow": {
      let h =
        titleH + estimateTextHeightPx(b.intro) + (b.intro.trim() ? LINE_PX : 0);
      for (const s of b.steps) {
        h +=
          20 +
          estimateTextHeightPx(s.title) +
          estimateTextHeightPx(s.detail) +
          8;
      }
      return h;
    }
    default:
      return 40;
  }
}

function packScopeBlocks(
  blocks: ScopeRenderBlock[],
  maxPx: number,
): ScopeRenderBlock[][] {
  const pages: ScopeRenderBlock[][] = [];
  let cur: ScopeRenderBlock[] = [];
  let used = 0;
  for (const b of blocks) {
    const bh = estimateScopeBlockHeight(b);
    if (used + bh > maxPx && cur.length) {
      pages.push(cur);
      cur = [];
      used = 0;
    }
    cur.push(b);
    used += bh;
  }
  if (cur.length) pages.push(cur);
  return pages.length ? pages : [[blocks[0]!]];
}

function packTermsPages(text: string, maxPx: number): string[] {
  const t = text.trim();
  if (!t) return [""];
  const paras = t.split(/\n\n+/);
  const pages: string[] = [];
  let buf: string[] = [];
  let used = 0;
  for (const para of paras) {
    const h = estimateTextHeightPx(para) + (buf.length ? LINE_PX : 0);
    if (used + h > maxPx && buf.length) {
      pages.push(buf.join("\n\n"));
      buf = [];
      used = 0;
    }
    buf.push(para);
    used += h;
  }
  if (buf.length) pages.push(buf.join("\n\n"));
  return pages;
}

/** Plain text → page chunks using the same content budget as the Proposals “Terms” section (A4). */
export function paginatePlainDocumentText(text: string): string[] {
  return packTermsPages(text, MAX_CONTENT_PX);
}

/** Same packing as Proposals → About eyay (headline on first page only when it fits). */
export function paginateAboutEyaSection(
  headline: string,
  body: string,
): Array<{
  showHeadline: boolean;
  headline: string;
  paragraphs: string[];
  continuation: boolean;
}> {
  const h = headline.trim();
  const bodyParas = body
    .split(/\n\n+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const seeds = h ? [h, ...bodyParas] : bodyParas.length ? bodyParas : ["—"];
  const chunks = packParagraphs(seeds, MAX_CONTENT_PX);
  return chunks.map((packedParagraphs, i) => {
    const showHeadline = Boolean(h) && i === 0 && packedParagraphs[0] === h;
    const paragraphs = showHeadline
      ? packedParagraphs.slice(1)
      : packedParagraphs;
    return {
      showHeadline,
      headline: h,
      paragraphs,
      continuation: i > 0,
    };
  });
}

/** Enabled sections in canonical PDF order (sidebar `order` is not used for pagination). */
function orderedEnabled(proposal: Proposal): SectionType[] {
  const enabled = new Set(
    proposal.sections.filter((s) => s.enabled).map((s) => s.type),
  );
  return PROPOSAL_SECTION_ORDER.filter((t) => enabled.has(t));
}

export function buildProposalPages(proposal: Proposal): ProposalPageModel[] {
  const pages: ProposalPageModel[] = [];
  let k = 0;
  const key = () => `p-${k++}`;

  pages.push({ key: key(), kind: "cover" });

  const order = orderedEnabled(proposal);
  for (const st of order) {
    if (st === "cover") continue;

    if (st === "about") {
      const chunks = packParagraphs(
        [proposal.about.context, proposal.about.problem, proposal.about.approach],
        MAX_CONTENT_PX,
      );
      chunks.forEach((paragraphs, i) => {
        const payload: SectionPagePayload = { type: "about", paragraphs };
        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload,
        });
      });
      continue;
    }

    if (st === "about-eya") {
      const headline = proposal.eyaAbout.headline;
      const bodyParas = proposal.eyaAbout.body
        .split(/\n\n+/)
        .map((t) => t.trim())
        .filter(Boolean);

      // First part is the headline; it should render only on the first packed page.
      const chunks = packParagraphs([headline, ...bodyParas], MAX_CONTENT_PX);
      chunks.forEach((packedParagraphs, i) => {
        const showHeadline = i === 0 && packedParagraphs[0] === headline;
        const paragraphs = showHeadline ? packedParagraphs.slice(1) : packedParagraphs;

        const payload: SectionPagePayload = {
          type: "about-eya",
          headline,
          paragraphs,
          showHeadline,
        };

        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload,
        });
      });
      continue;
    }

    if (st === "project-scope") {
      const blocks = flattenProjectScope(proposal.projectScope);
      const packed = packScopeBlocks(blocks, MAX_CONTENT_PX);
      packed.forEach((chunk, i) => {
        const payload: SectionPagePayload = {
          type: "project-scope",
          blocks: chunk,
        };
        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload,
        });
      });
      continue;
    }

    if (st === "deliverables") {
      const packs = packDeliverablePages(
        proposal.deliverables.intro,
        proposal.deliverables.items,
        MAX_CONTENT_PX,
      );
      packs.forEach((pack, i) => {
        const payload: SectionPagePayload = {
          type: "deliverables",
          intro: pack.intro,
          items: pack.items,
        };
        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload,
        });
      });
      continue;
    }

    if (st === "how-we-work") {
      const pillarPages = packPillarPages(proposal.howWeWork.pillars, MAX_CONTENT_PX);
      pillarPages.forEach((pillarChunk, i) => {
        const payload: SectionPagePayload = {
          type: "how-we-work",
          pillars: pillarChunk,
        };
        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload,
        });
      });
      continue;
    }

    if (st === "timeline") {
      const payload: SectionPagePayload = {
        type: "timeline",
        phases: proposal.timeline.phases,
        startNote: proposal.timeline.startNote,
      };
      pages.push({
        key: key(),
        kind: "section",
        sectionType: st,
        title: SECTION_TITLES[st],
        continuation: false,
        payload,
      });
      continue;
    }

    if (st === "pricing-options") {
      const d = proposal.pricingOptions;
      pages.push({
        key: key(),
        kind: "section",
        sectionType: st,
        title: SECTION_TITLES[st],
        continuation: false,
        payload: { type: "pricing-options", slice: "compare", data: d },
      });
      pages.push({
        key: key(),
        kind: "section",
        sectionType: st,
        title: SECTION_TITLES[st],
        continuation: true,
        payload: { type: "pricing-options", slice: "detail", data: d },
      });
      continue;
    }

    if (st === "investment") {
      const payload: SectionPagePayload = {
        type: "investment",
        items: proposal.investment.items,
        vatNote: proposal.investment.vatNote,
        paymentTerms: proposal.investment.paymentTerms,
      };
      pages.push({
        key: key(),
        kind: "section",
        sectionType: st,
        title: SECTION_TITLES[st],
        continuation: false,
        payload,
      });
      continue;
    }

    if (st === "team") {
      const sorted = [...proposal.team.members].sort((a, b) => {
        if (a.side === b.side) return 0;
        return a.side === "studio" ? -1 : 1;
      });
      const payload: SectionPagePayload = {
        type: "team",
        members: sorted,
      };
      pages.push({
        key: key(),
        kind: "section",
        sectionType: st,
        title: SECTION_TITLES[st],
        continuation: false,
        payload,
      });
      continue;
    }

    if (st === "decisions") {
      const d = proposal.decisions;
      const lines: string[] = [];
      if (d.intro.trim()) lines.push(d.intro.trim());
      d.items.forEach((x, i) => {
        if (x.text.trim()) lines.push(`${i + 1}. ${x.text.trim()}`);
      });
      const chunks = packParagraphs(
        lines.length ? lines : ["—"],
        MAX_CONTENT_PX,
      );
      chunks.forEach((paragraphs, i) => {
        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload: { type: "decisions", paragraphs },
        });
      });
      continue;
    }

    if (st === "next-steps") {
      const payload: SectionPagePayload = {
        type: "next-steps",
        steps: proposal.nextSteps.steps,
        cta: proposal.nextSteps.cta,
        calLink: proposal.nextSteps.calLink,
      };
      pages.push({
        key: key(),
        kind: "section",
        sectionType: st,
        title: SECTION_TITLES[st],
        continuation: false,
        payload,
      });
      continue;
    }

    if (st === "terms") {
      const termPages = packTermsPages(proposal.terms, MAX_CONTENT_PX);
      termPages.forEach((text, i) => {
        const payload: SectionPagePayload = { type: "terms", text };
        pages.push({
          key: key(),
          kind: "section",
          sectionType: st,
          title: SECTION_TITLES[st],
          continuation: i > 0,
          payload,
        });
      });
    }
  }

  return pages;
}

/** First PDF page index (0-based) where a section begins */
export function getSectionStartPageIndex(
  proposal: Proposal,
  sectionType: SectionType,
): number {
  if (sectionType === "cover") return 0;
  const pages = buildProposalPages(proposal);
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i]!;
    if (p.kind === "section" && p.sectionType === sectionType && !p.continuation) {
      return i;
    }
  }
  return 0;
}

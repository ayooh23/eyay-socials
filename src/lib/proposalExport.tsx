import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import ProposalRenderer from "@/components/proposals/ProposalRenderer";
import { buildProposalPages } from "@/lib/proposalPaginate";
import type { Proposal } from "@/lib/proposalTypes";
import {
  PROPOSAL_COVER_STYLES,
  PROPOSAL_PRICELIST_THEME,
  PROPOSAL_PRICING_OPTIONS_THEME,
  PROPOSAL_TERMS_THEME,
  PROPOSAL_THEMES,
} from "@/lib/proposalThemes";

/** html2canvas scale: below 2× cuts pixels sharply; 1.5 stays readable on A4 */
const EXPORT_RASTER_SCALE = 1.5;
/** JPEG quality 0–1 (canvas encode); much smaller than PNG for flat UI pages */
const EXPORT_JPEG_QUALITY = 0.84;

function waitFrames(n: number): Promise<void> {
  return new Promise((resolve) => {
    let c = 0;
    const step = () => {
      c += 1;
      if (c >= n) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

export async function exportProposalPDF(proposal: Proposal): Promise<void> {
  const [jspdfMod, html2canvas] = await Promise.all([
    import("jspdf"),
    import("html2canvas").then((m) => m.default),
  ]);

  const JsPDF = jspdfMod.default;
  const pages = buildProposalPages(proposal);
  const themeBg = PROPOSAL_THEMES[proposal.theme].bg;
  const pdf = new JsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
    compress: true,
  });

  const holder = document.createElement("div");
  holder.setAttribute("aria-hidden", "true");
  /* Must stay in viewport — off-screen (-9999px) often paints blank in html2canvas (esp. cover). */
  holder.style.cssText =
    "position:fixed;left:0;top:0;width:794px;height:1123px;overflow:hidden;pointer-events:none;z-index:-1;";
  document.body.appendChild(holder);

  try {
    for (let i = 0; i < pages.length; i++) {
      const wrap = document.createElement("div");
      const page = pages[i]!;
      const isPricing =
        page.kind === "section" && page.sectionType === "pricing-options";
      const isAboutEya =
        page.kind === "section" && page.sectionType === "about-eya";
      const isPricelist =
        page.kind === "section" && page.sectionType === "investment";
      const isTerms =
        page.kind === "section" && page.sectionType === "terms";
      const canvasBg =
        page.kind === "cover"
          ? PROPOSAL_COVER_STYLES.bg
          : isPricing || isAboutEya
            ? PROPOSAL_PRICING_OPTIONS_THEME.bg
            : isPricelist || isTerms
              ? PROPOSAL_PRICELIST_THEME.bg
              : themeBg;

      wrap.style.cssText = `width:794px;height:1123px;overflow:hidden;box-sizing:border-box;background-color:${canvasBg};`;
      holder.appendChild(wrap);

      const root = createRoot(wrap);
      flushSync(() => {
        root.render(
          <ProposalRenderer
            proposal={proposal}
            page={page}
            pageIndex={i}
            totalPages={pages.length}
          />,
        );
      });

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }
      /* Extra frames so first page (cover) fonts + blue fill are committed before raster. */
      await waitFrames(page.kind === "cover" ? 4 : 2);

      const canvas = await html2canvas(wrap, {
        scale: EXPORT_RASTER_SCALE,
        width: 794,
        height: 1123,
        useCORS: true,
        backgroundColor: canvasBg,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123,
        onclone: (_doc, el) => {
          const node = el.querySelector("[data-proposal-page]");
          if (!(node instanceof HTMLElement)) return;
          if (page.kind === "cover") {
            node.style.backgroundColor = PROPOSAL_COVER_STYLES.bg;
            node.style.color = PROPOSAL_COVER_STYLES.text;
            return;
          }
          if (isPricing || isAboutEya) {
            node.style.backgroundColor = PROPOSAL_PRICING_OPTIONS_THEME.bg;
            node.style.color = PROPOSAL_PRICING_OPTIONS_THEME.text;
            return;
          }
          if (isPricelist || isTerms) {
            node.style.backgroundColor = PROPOSAL_TERMS_THEME.bg;
            node.style.color = PROPOSAL_TERMS_THEME.text;
            return;
          }
        },
      });

      const img = canvas.toDataURL("image/jpeg", EXPORT_JPEG_QUALITY);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, 210, 297, undefined, "MEDIUM");

      root.unmount();
      holder.removeChild(wrap);
    }
  } finally {
    document.body.removeChild(holder);
  }

  const num = proposal.meta.proposalNumber.replace(/[^\w.-]+/g, "-") || "draft";
  pdf.save(`eyay-proposal-${num}.pdf`);
}

// TODO: copyProposalLink — serialise proposal state to a base64 URL param for easy sharing

"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";
import type { DocCoverModel, DocPage } from "./docPages";
import { DOC_ABOUT_EYA_TITLE } from "./docPages";
import {
  DOC_TEXT_PAD_BOTTOM,
  DOC_TEXT_PAD_TOP,
  DOC_TEXT_PAD_X,
} from "./docPageLayout";
import {
  renderDocMarkdownPdf,
  type DocMarkdownPdfCtx,
} from "./docMarkdownPdf";
import { lexDocMarkdown } from "./docMarkdownLex";
import {
  PROPOSAL_COVER_STYLES,
  PROPOSAL_PRICING_OPTIONS_THEME,
  PROPOSAL_THEMES,
} from "./proposalThemes";

const A4_WIDTH_PT = 595.28;
const A4_HEIGHT_PT = 841.89;
const PAGE_WIDTH_PX = 794;
const MARGIN_PX = 60;
const PX_TO_PT = A4_WIDTH_PT / PAGE_WIDTH_PX;
const A4_PAGE_SIZE_PT: [number, number] = [A4_WIDTH_PT, A4_HEIGHT_PT];
const FONT_SANS = "DMSans";
const FONT_MONO = "DMMono";

const PDF_COVER_DETAIL = "#b4d4ff";
const PDF_COVER_FOOTER_DETAIL = "#9ec6ff";

let fontsRegistered = false;

function registerPdfFontsOnce(): void {
  if (fontsRegistered) return;
  fontsRegistered = true;
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-normal.woff",
    fontWeight: 400,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-300-normal.woff",
    fontWeight: 300,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-700-normal.woff",
    fontWeight: 700,
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-300-italic.woff",
    fontWeight: 300,
    fontStyle: "italic",
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-400-italic.woff",
    fontWeight: 400,
    fontStyle: "italic",
  });
  Font.register({
    family: FONT_SANS,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-sans@latest/latin-700-italic.woff",
    fontWeight: 700,
    fontStyle: "italic",
  });
  Font.register({
    family: FONT_MONO,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-mono@latest/latin-400-normal.woff",
    fontWeight: 400,
  });
}

function pt(px: number): number {
  return px * PX_TO_PT;
}

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function sectionHeaderStripeColor(pageBg: string): string {
  const bg = pageBg.trim().toLowerCase();
  if (bg === "#0000ff") return "#ffffff";
  const darkPageBgs = new Set(["#000000", "#0a0a0a", "#111111", "#111"]);
  if (darkPageBgs.has(bg)) return "#ffffff";
  return "#c4c4c4";
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const layout = StyleSheet.create({
  page: {
    paddingTop: pt(MARGIN_PX),
    paddingBottom: pt(48),
    paddingLeft: pt(MARGIN_PX),
    paddingRight: pt(MARGIN_PX),
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  coverPage: {
    display: "flex",
    flexDirection: "column",
    paddingTop: pt(MARGIN_PX),
    paddingBottom: pt(MARGIN_PX),
    paddingLeft: pt(MARGIN_PX),
    paddingRight: pt(MARGIN_PX),
  },
  headerLabel: {
    fontFamily: FONT_SANS,
    fontSize: pt(22),
    letterSpacing: -0.2,
    fontWeight: 700,
  },
  headerContinued: {
    fontFamily: FONT_SANS,
    fontSize: pt(12),
    fontWeight: 400,
  },
  sectionBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  pageNumber: {
    position: "absolute",
    right: pt(MARGIN_PX),
    bottom: pt(MARGIN_PX),
    fontFamily: FONT_MONO,
    fontSize: pt(10),
  },
  bodyText: {
    fontFamily: FONT_SANS,
    fontSize: pt(13),
    fontWeight: 300,
    lineHeight: 1.7,
  },
});

function DocCoverPdf({
  cover,
  pageIndex,
  totalPages,
}: {
  cover: DocCoverModel;
  pageIndex: number;
  totalPages: number;
}) {
  const meta = cover;
  return (
    <Page
      size={A4_PAGE_SIZE_PT}
      style={[layout.coverPage, { backgroundColor: PROPOSAL_COVER_STYLES.bg }]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontSize: pt(10),
            color: PDF_COVER_DETAIL,
            letterSpacing: 1,
            textTransform: "uppercase" as const,
          }}
        >
          eyay.studio
        </Text>
        <Text
          style={{
            fontFamily: FONT_MONO,
            fontSize: pt(10),
            color: PDF_COVER_DETAIL,
            letterSpacing: 1,
            textTransform: "uppercase" as const,
          }}
        >
          {meta.docNumber.trim() || "—"}
        </Text>
      </View>
      <View
        style={{
          height: pt(2),
          backgroundColor: PROPOSAL_COVER_STYLES.rule,
          marginTop: pt(12),
          width: "100%",
        }}
      />
      <View style={{ height: pt(48) }} />

      <Text
        style={{
          fontFamily: FONT_SANS,
          fontSize: pt(48),
          fontWeight: 700,
          letterSpacing: -0.2,
          lineHeight: 1.05,
          color: PROPOSAL_COVER_STYLES.text,
        }}
      >
        {meta.projectName.trim() || "Document"}
      </Text>

      <Text
        style={{
          fontFamily: FONT_MONO,
          fontSize: pt(12),
          color: PDF_COVER_DETAIL,
          letterSpacing: 0.8,
          textTransform: "uppercase" as const,
          marginTop: pt(12),
        }}
      >
        {meta.clientName.trim() || "—"}
      </Text>

      <View style={{ height: pt(48) }} />

      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          rowGap: pt(14),
          columnGap: pt(28),
        }}
      >
        {[
          ["Prepared by", meta.preparedBy || "eyay studio"],
          ["Prepared for", meta.clientName.trim() || "—"],
          ["Date", fmtDate(meta.proposalDate)],
          ["Type", meta.docType.trim() || "—"],
        ].map(([label, value]) => (
          <View key={label} style={{ width: "47%" }}>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontSize: pt(10),
                color: PDF_COVER_DETAIL,
                letterSpacing: 0.8,
                textTransform: "uppercase" as const,
                marginBottom: pt(4),
              }}
            >
              {label}
            </Text>
            <Text
              style={{
                fontFamily: FONT_SANS,
                fontSize: pt(12),
                color: PROPOSAL_COVER_STYLES.text,
                letterSpacing: 0.2,
              }}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Text
        style={{
          fontFamily: FONT_MONO,
          fontSize: pt(10),
          color: PDF_COVER_FOOTER_DETAIL,
          letterSpacing: 0.5,
        }}
      >
        {meta.studioEmail}
        {"\n"}
        {meta.studioAddress}
      </Text>
      <Text
        style={[
          layout.pageNumber,
          { color: PROPOSAL_COVER_STYLES.text, opacity: 0.3 },
        ]}
      >
        {pageIndex + 1} / {totalPages}
      </Text>
    </Page>
  );
}

export async function exportDocPdf(
  pages: DocPage[],
  downloadTitle: string,
): Promise<void> {
  if (!pages.length) return;
  registerPdfFontsOnce();
  const light = PROPOSAL_THEMES.light;
  const aboutScheme = PROPOSAL_PRICING_OPTIONS_THEME;
  const totalPages = pages.length;

  const lightMdCtx: DocMarkdownPdfCtx = {
    pt,
    fontSans: FONT_SANS,
    fontMono: FONT_MONO,
    bodyFontSize: pt(13),
    textColor: light.text,
    mutedColor: light.muted,
    accentColor: light.accent,
    linkColor: light.accent,
    borderColor: light.border,
    codeBg: light.surface,
  };

  const aboutMdCtx: DocMarkdownPdfCtx = {
    pt,
    fontSans: FONT_SANS,
    fontMono: FONT_MONO,
    bodyFontSize: pt(13),
    textColor: aboutScheme.text,
    mutedColor: aboutScheme.muted,
    accentColor: aboutScheme.accent,
    linkColor: "rgba(255,255,255,0.95)",
    borderColor: aboutScheme.border,
    codeBg: "rgba(255,255,255,0.12)",
  };

  const aboutHeadlineMdCtx: DocMarkdownPdfCtx = {
    ...aboutMdCtx,
    bodyFontSize: pt(20),
    textColor: aboutScheme.accent,
    lead: true,
  };

  const doc = (
    <Document>
      {pages.map((p, idx) => {
        if (p.kind === "cover") {
          return (
            <DocCoverPdf
              key={p.key}
              cover={p.cover}
              pageIndex={idx}
              totalPages={totalPages}
            />
          );
        }

        if (p.kind === "body") {
          return (
            <Page
              key={p.key}
              size={A4_PAGE_SIZE_PT}
              style={[
                layout.page,
                {
                  paddingTop: pt(DOC_TEXT_PAD_TOP),
                  paddingBottom: pt(DOC_TEXT_PAD_BOTTOM),
                  paddingLeft: pt(DOC_TEXT_PAD_X),
                  paddingRight: pt(DOC_TEXT_PAD_X),
                  backgroundColor: light.bg,
                  color: light.text,
                },
              ]}
            >
              <Text style={[layout.headerLabel, { color: light.text }]}>
                {p.sectionTitle.trim() || "Document"}
                {p.continuation ? (
                  <Text
                    style={[
                      layout.headerContinued,
                      { color: light.muted },
                    ]}
                  >
                    {" "}
                    (cont.)
                  </Text>
                ) : null}
              </Text>
              <View
                style={{
                  width: pt(40),
                  height: pt(4),
                  backgroundColor: sectionHeaderStripeColor(light.bg),
                  marginTop: pt(8),
                  marginBottom: pt(20),
                }}
              />
              <View style={layout.sectionBody}>
                {renderDocMarkdownPdf(lexDocMarkdown(p.body), lightMdCtx)}
              </View>
              <Text
                style={[
                  layout.pageNumber,
                  {
                    color: light.text,
                    opacity: 0.3,
                    right: pt(DOC_TEXT_PAD_X),
                    bottom: pt(DOC_TEXT_PAD_X),
                  },
                ]}
              >
                {idx + 1} / {totalPages}
              </Text>
            </Page>
          );
        }

        return (
          <Page
            key={p.key}
            size={A4_PAGE_SIZE_PT}
            style={[
              layout.page,
              {
                paddingTop: pt(DOC_TEXT_PAD_TOP),
                paddingBottom: pt(DOC_TEXT_PAD_BOTTOM),
                paddingLeft: pt(DOC_TEXT_PAD_X),
                paddingRight: pt(DOC_TEXT_PAD_X),
                backgroundColor: aboutScheme.bg,
                color: aboutScheme.text,
              },
            ]}
          >
            <Text style={[layout.headerLabel, { color: aboutScheme.text }]}>
              {DOC_ABOUT_EYA_TITLE}
              {p.continuation ? (
                <Text
                  style={[
                    layout.headerContinued,
                    { color: aboutScheme.accent },
                  ]}
                >
                  {" "}
                  (cont.)
                </Text>
              ) : null}
            </Text>
            <View
              style={{
                width: pt(40),
                height: pt(4),
                backgroundColor: sectionHeaderStripeColor(aboutScheme.bg),
                marginTop: pt(8),
                marginBottom: pt(20),
              }}
            />
            <View style={layout.sectionBody}>
              {p.showHeadline && p.headline.trim() ? (
                <View style={{ marginBottom: pt(16) }}>
                  {renderDocMarkdownPdf(
                    lexDocMarkdown(p.headline),
                    aboutHeadlineMdCtx,
                  )}
                </View>
              ) : null}
              {p.paragraphs.map((para, i) => (
                <View key={`${i}-${para.slice(0, 12)}`}>
                  {renderDocMarkdownPdf(lexDocMarkdown(para), aboutMdCtx)}
                </View>
              ))}
            </View>
            <Text
              style={[
                layout.pageNumber,
                {
                  color: aboutScheme.text,
                  opacity: 0.35,
                  right: pt(DOC_TEXT_PAD_X),
                  bottom: pt(DOC_TEXT_PAD_X),
                },
              ]}
            >
              {idx + 1} / {totalPages}
            </Text>
          </Page>
        );
      })}
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const displayTitle = downloadTitle.trim() || "Document";
  const safe =
    displayTitle.replace(/[^\w.-]+/g, "-").replace(/^-|-$/g, "") ||
    "document";
  downloadBlob(blob, `eyay-doc-${safe}.pdf`);
}

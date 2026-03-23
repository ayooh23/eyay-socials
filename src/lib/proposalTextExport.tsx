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
import type { Proposal, ProposalPageModel, SectionPagePayload } from "./proposalTypes";
import { buildProposalPages } from "./proposalPaginate";
import {
  PROPOSAL_COVER_STYLES,
  PROPOSAL_PRICELIST_THEME,
  PROPOSAL_PRICING_OPTIONS_THEME,
  PROPOSAL_TERMS_THEME,
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

let fontsRegistered = false;

function registerPdfFontsOnce(): void {
  if (fontsRegistered) return;
  fontsRegistered = true;

  // Export-text PDF fonts: only DM Sans + DM Mono.
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
  Font.register({
    family: FONT_MONO,
    src: "https://cdn.jsdelivr.net/fontsource/fonts/dm-mono@latest/latin-500-normal.woff",
    fontWeight: 500,
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

function formatEuro(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function stripMarkdownLinks(s: string): string {
  // Converts `[label](url)` -> `label` for this renderer.
  return s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

function formatPriceCell(price: number, unit: "fixed" | "monthly" | "daily"): string {
  if (unit === "monthly") return `${formatEuro(price)}/mo`;
  if (unit === "daily") return `${formatEuro(price)}/day`;
  if (price <= 0) return "Custom";
  return formatEuro(price);
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

/** PDF cover only: light blue for meta / labels on eyay blue (replaces grey-white). */
const PDF_COVER_DETAIL = "#b4d4ff";
const PDF_COVER_FOOTER_DETAIL = "#9ec6ff";

/** Under-title accent bar: white on blue/dark pages, neutral on light pages (avoids blue “stroke” on cream). */
function sectionHeaderStripeColor(pageBg: string): string {
  const bg = pageBg.trim().toLowerCase();
  if (bg === "#0000ff") return "#ffffff";
  const darkPageBgs = new Set(["#000000", "#0a0a0a", "#111111", "#111"]);
  if (darkPageBgs.has(bg)) return "#ffffff";
  /* Solid hex only — avoids viewer fringe when rgba grays sit on cream. */
  return "#c4c4c4";
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
  monoMuted: {
    fontFamily: FONT_MONO,
    fontSize: pt(10),
    fontWeight: 400,
    letterSpacing: 0.1,
    textTransform: "uppercase" as const,
  },
  monoUpper: {
    fontFamily: FONT_MONO,
    fontSize: pt(10),
    fontWeight: 400,
    letterSpacing: 0.1,
    textTransform: "uppercase" as const,
  },
});

function MultilineText({
  text,
  style,
  lineGapPx = 0,
}: {
  text: string;
  style: any;
  lineGapPx?: number;
}) {
  const lines = (text ?? "").split("\n");
  return (
    <View>
      {lines.map((ln, i) => (
        <Text
          // eslint-disable-next-line react/no-array-index-key
          key={`${i}-${ln.slice(0, 12)}`}
          style={[
            style,
            i === lines.length - 1
              ? null
              : ln.trim()
                ? { marginBottom: 0 }
                : { marginBottom: pt(10 + lineGapPx) },
          ]}
        >
          {ln || " "}
        </Text>
      ))}
    </View>
  );
}

function PricingOptionsBody({
  payload,
  scheme,
}: {
  payload: Extract<SectionPagePayload, { type: "pricing-options" }>;
  scheme: { bg: string; text: string; muted: string; accent: string; border: string };
}) {
  const d = payload.data;
  const hasB = !!d.optionBEnabled;
  const whiteAccent = "#ffffff";
  /** Solid white: semi-transparent white on #0000FF often reads as cyan/teal (“green”) in PDF viewers. */
  const whiteStroke = "#ffffff";

  if (payload.slice === "compare") {
    return (
      <View style={layout.sectionBody}>
        {d.intro.trim() ? (
          <Text style={[layout.bodyText, { color: scheme.text, marginBottom: pt(18) }]}>
            {d.intro}
          </Text>
        ) : null}

        {hasB ? (
          <View style={{ flexDirection: "row", marginBottom: pt(20), alignItems: "stretch" }}>
            <View style={{ flex: 1, paddingRight: pt(10) }}>
              <Text style={[layout.monoMuted, { color: scheme.accent, marginBottom: pt(6) }]}>
                {d.optionATitle}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: pt(18),
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color: whiteAccent,
                }}
              >
                {d.summaryA}
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: whiteStroke,
                alignSelf: "stretch",
              }}
            />

            <View style={{ flex: 1, paddingLeft: pt(10) }}>
              <Text style={[layout.monoMuted, { color: scheme.accent, marginBottom: pt(6) }]}>
                {d.optionBTitle}
              </Text>
              <Text
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: pt(18),
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color: whiteAccent,
                }}
              >
                {d.summaryB}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: pt(20) }}>
            <Text style={[layout.monoMuted, { color: scheme.accent, marginBottom: pt(6) }]}>
              {d.optionATitle}
            </Text>
            <Text
              style={{
                fontFamily: FONT_SANS,
                fontSize: pt(18),
                fontWeight: 700,
                letterSpacing: -0.2,
                color: whiteAccent,
              }}
            >
              {d.summaryA}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "column", flex: 1 }}>
          <View style={{ flexDirection: "row", paddingBottom: pt(10), borderBottomWidth: 1, borderBottomColor: whiteStroke }}>
            <View style={{ width: pt(180) }} />
            <View style={hasB ? { width: pt(170), paddingLeft: pt(10) } : { flex: 1, paddingLeft: pt(10) }}>
              <Text style={[layout.monoMuted, { color: scheme.accent }]}>{d.optionATitle.replace(/^Option [AB] — /i, "A — ")}</Text>
            </View>
            {hasB ? (
              <View style={{ width: pt(170), paddingLeft: pt(16), borderLeftWidth: 1, borderLeftColor: whiteStroke }}>
                <Text style={[layout.monoMuted, { color: scheme.accent }]}>{d.optionBTitle.replace(/^Option [AB] — /i, "B — ")}</Text>
              </View>
            ) : null}
          </View>

          {d.rows.map((row) => (
            <View
              key={row.id}
              style={{
                flexDirection: "row",
                paddingTop: pt(10),
                paddingBottom: pt(10),
                borderBottomWidth: 1,
                borderBottomColor: whiteStroke,
              }}
            >
              <View style={{ width: pt(180), paddingRight: pt(10) }}>
                <Text style={[layout.monoUpper, { color: scheme.accent }]}>{row.label}</Text>
              </View>
              <View style={hasB ? { width: pt(170), paddingRight: pt(10) } : { flex: 1, paddingRight: pt(10) }}>
                <Text style={{ fontFamily: FONT_SANS, fontSize: pt(13), fontWeight: 300, color: scheme.text }}>
                  {row.optionA}
                </Text>
              </View>
              {hasB ? (
                <View style={{ width: pt(170), paddingLeft: pt(16), borderLeftWidth: 1, borderLeftColor: whiteStroke }}>
                  <Text style={{ fontFamily: FONT_SANS, fontSize: pt(13), fontWeight: 300, color: scheme.text }}>
                    {row.optionB}
                  </Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>
    );
  }

  // slice === "detail"
  return (
    <View style={layout.sectionBody}>
      <View style={{ marginBottom: pt(20), paddingBottom: pt(16), borderBottomWidth: 1, borderBottomColor: whiteStroke }}>
        <Text style={[layout.monoUpper, { color: whiteAccent, marginBottom: pt(8) }]}>{d.optionATitle}</Text>
        <MultilineText text={d.narrativeA} style={{ ...layout.bodyText, color: scheme.text }} />
      </View>

      {hasB ? (
        <View style={{ marginBottom: pt(20) }}>
          <Text style={[layout.monoUpper, { color: whiteAccent, marginBottom: pt(8) }]}>{d.optionBTitle}</Text>
          <MultilineText text={d.narrativeB} style={{ ...layout.bodyText, color: scheme.text }} />
        </View>
      ) : null}

      <Text style={[layout.monoMuted, { color: scheme.accent, marginBottom: pt(8) }]}>
        {hasB ? "Both options include" : "Includes"}
      </Text>
      <MultilineText text={d.bothInclude} style={{ ...layout.bodyText, color: scheme.text, marginBottom: pt(16) }} />

      <Text style={[layout.monoMuted, { color: scheme.accent, marginBottom: pt(8) }]}>
        {hasB ? "Not included in either option" : "Not included"}
      </Text>
      <MultilineText text={d.notIncluded} style={{ ...layout.bodyText, color: scheme.text, marginBottom: pt(16) }} />

      <Text style={[layout.monoUpper, { color: scheme.accent, marginTop: pt(12), lineHeight: 1.6 }]}>
        Payment terms:{" "}
        {d.paymentTerms}
      </Text>
    </View>
  );
}

function InvestmentBody({
  payload,
  scheme,
}: {
  payload: Extract<SectionPagePayload, { type: "investment" }>;
  scheme: { bg: string; text: string; muted: string; accent: string; border: string };
}) {
  const rows = payload.items.filter((r) => r.included);
  const tableStroke = "#ffffff";

  // fixed column widths (points) to keep the table stable
  const labelW = pt(110);
  const descW = pt(200);
  const qtyW = pt(90);
  const priceW = pt(160);

  return (
    <View style={layout.sectionBody}>
      <View style={{ flexDirection: "column" }}>
        <View
          style={{
            flexDirection: "row",
            paddingBottom: pt(10),
            borderBottomWidth: 1,
            borderBottomColor: tableStroke,
          }}
        >
          <View style={{ width: labelW }}>
            <Text style={[layout.monoMuted, { color: scheme.accent }]}>Label</Text>
          </View>
          <View style={{ width: descW }}>
            <Text style={[layout.monoMuted, { color: scheme.accent }]}>Description</Text>
          </View>
          <View style={{ width: qtyW, alignItems: "flex-end" }}>
            <Text style={[layout.monoMuted, { color: scheme.accent }]}>Qty</Text>
          </View>
          <View style={{ width: priceW, alignItems: "flex-end" }}>
            <Text style={[layout.monoMuted, { color: scheme.accent }]}>Price</Text>
          </View>
        </View>

        {rows.map((r) => {
          return (
            <View
              key={r.id}
              style={{
                flexDirection: "row",
                paddingTop: pt(12),
                paddingBottom: pt(12),
                borderBottomWidth: 1,
                borderBottomColor: tableStroke,
              }}
            >
              <View style={{ width: labelW, paddingRight: pt(8) }}>
                <Text style={{ fontFamily: FONT_SANS, fontSize: pt(13), fontWeight: 700, color: scheme.text }}>
                  {r.label}
                </Text>
              </View>
              <View style={{ width: descW, paddingRight: pt(8) }}>
                <Text style={{ fontFamily: FONT_SANS, fontSize: pt(11), fontWeight: 300, color: scheme.accent, marginTop: pt(4), lineHeight: 1.6 }}>
                  {r.description}
                </Text>
              </View>
              <View style={{ width: qtyW, alignItems: "flex-end" }}>
                <Text style={{ fontFamily: FONT_SANS, fontSize: pt(12), fontWeight: 400, color: scheme.text }}>
                  {r.quantity}
                </Text>
              </View>
              <View style={{ width: priceW, alignItems: "flex-end" }}>
                <Text style={{ fontFamily: FONT_SANS, fontSize: pt(12), fontWeight: 400, color: scheme.text }}>
                  {formatPriceCell(r.price, r.unit)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={[layout.monoMuted, { color: scheme.accent, marginTop: pt(12) }]}>{payload.vatNote}</Text>
      <Text style={[layout.monoUpper, { color: scheme.accent, marginTop: pt(8), lineHeight: 1.6 }]}>
        Payment terms: {payload.paymentTerms}
      </Text>
    </View>
  );
}

function TeamBody({
  payload,
  scheme,
  clientName,
}: {
  payload: Extract<SectionPagePayload, { type: "team" }>;
  scheme: { bg: string; text: string; muted: string; accent: string; border: string };
  clientName: string;
}) {
  /** Studio cards sit on eyay blue; client cards sit on the (usually light) page — use dark type on white. */
  const TEAM_STUDIO_BG = PROPOSAL_PRICING_OPTIONS_THEME.bg;
  const TEAM_CLIENT_BG = "#ffffff";
  const clientBorder = "rgba(0,0,0,0.12)";
  const studioBorder = "#ffffff";

  let shownStudio = false;
  let shownClient = false;

  return (
    <View style={layout.sectionBody}>
      {payload.members.map((m) => {
        const isClient = m.side === "client";
        const showLabel =
          (isClient && !shownClient) || (!isClient && !shownStudio);

        if (isClient) shownClient = true;
        else shownStudio = true;

        const nameColor = isClient ? "#0a0a0a" : "#ffffff";
        const roleColor = isClient ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";
        const bioColor = isClient ? "#1a1a1a" : "rgba(255,255,255,0.92)";

        return (
          <View key={m.id} style={{ marginBottom: pt(20) }}>
            {showLabel ? (
              <Text
                style={[
                  layout.monoUpper,
                  {
                    color: isClient ? scheme.text : scheme.accent,
                    marginBottom: pt(10),
                  },
                ]}
              >
                {isClient ? `${clientName.trim() || "Client"} team` : "eyay studio"}
              </Text>
            ) : null}

            <View
              style={{
                padding: pt(16),
                backgroundColor: isClient ? TEAM_CLIENT_BG : TEAM_STUDIO_BG,
                borderWidth: 1,
                borderColor: isClient ? clientBorder : studioBorder,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, paddingRight: pt(8) }}>
                  <Text style={{ fontFamily: FONT_SANS, fontSize: pt(15), fontWeight: 700, color: nameColor }}>
                    {m.name}
                  </Text>
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: pt(10),
                      letterSpacing: 0.1,
                      textTransform: "uppercase",
                      color: roleColor,
                      marginTop: pt(4),
                    }}
                  >
                    {m.role}
                  </Text>
                </View>
                {isClient ? (
                  <Text
                    style={{
                      fontFamily: FONT_MONO,
                      fontSize: pt(8),
                      letterSpacing: 0.14,
                      textTransform: "uppercase",
                      color: scheme.accent,
                      opacity: 0.95,
                    }}
                  >
                    Client
                  </Text>
                ) : null}
              </View>
              <Text
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: pt(13),
                  fontWeight: 300,
                  lineHeight: 1.7,
                  color: bioColor,
                  marginTop: pt(12),
                }}
              >
                {m.bio}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ScopeBlockBody({
  block,
  scheme,
}: {
  block: Extract<SectionPagePayload, { type: "project-scope" }>["blocks"][number];
  scheme: { text: string; accent: string };
}) {
  const bodyTextStyle = {
    ...layout.bodyText,
    color: scheme.text,
  };

  if (block.kind === "product") {
    return (
      <View style={{ marginBottom: pt(22) }}>
        <Text
          style={{
            fontFamily: FONT_SANS,
            fontSize: pt(16),
            fontWeight: 700,
            letterSpacing: -0.15,
            marginBottom: pt(10),
          }}
        >
          {block.title}
        </Text>
        <Text style={bodyTextStyle}>{block.body}</Text>
      </View>
    );
  }

  if (block.kind === "bullets") {
    return (
      <View style={{ marginBottom: pt(22) }}>
        <Text
          style={{
            fontFamily: FONT_SANS,
            fontSize: pt(16),
            fontWeight: 700,
            letterSpacing: -0.15,
            marginBottom: pt(8),
          }}
        >
          {block.title}
        </Text>
        {block.intro.trim() ? (
          <Text style={[bodyTextStyle, { marginBottom: pt(12) }]}>{block.intro}</Text>
        ) : null}
        {block.items.map((it, i) => (
          <Text key={`${i}-${it.slice(0, 16)}`} style={[bodyTextStyle, { marginBottom: pt(8) }]}>
            {"\u2022"} {it}
          </Text>
        ))}
      </View>
    );
  }

  // flow
  return (
    <View style={{ marginBottom: pt(22) }}>
      <Text
        style={{
          fontFamily: FONT_SANS,
          fontSize: pt(16),
          fontWeight: 700,
          letterSpacing: -0.15,
          marginBottom: pt(8),
        }}
      >
        {block.title}
      </Text>
      {block.intro.trim() ? (
        <Text style={[bodyTextStyle, { marginBottom: pt(14) }]}>{block.intro}</Text>
      ) : null}
      {block.steps.map((s, i) => (
        <View key={`${i}-${s.title.slice(0, 12)}`} style={{ flexDirection: "row", marginBottom: pt(14) }}>
          <View style={{ width: pt(20) }}>
            <Text
              style={{
                fontFamily: FONT_MONO,
                fontSize: pt(10),
                letterSpacing: 0.08,
                textTransform: "uppercase",
                color: scheme.accent,
              }}
            >
              {i + 1}.
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONT_SANS, fontSize: pt(14), fontWeight: 700, marginBottom: pt(4), color: scheme.text }}>
              {s.title}
            </Text>
            <Text style={{ fontFamily: FONT_SANS, fontSize: pt(13), fontWeight: 300, color: scheme.text }}>
              {s.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function GenericSectionBody({
  payload,
  proposalTheme,
  clientName,
}: {
  payload: SectionPagePayload;
  proposalTheme: Proposal["theme"];
  clientName: string;
}) {
  const t = PROPOSAL_THEMES[proposalTheme];
  const bodyTextStyle = { ...layout.bodyText, color: t.text };

  if (payload.type === "about") {
    return (
      <View style={layout.sectionBody}>
        {payload.paragraphs.map((p, i) => (
          <Text key={`${i}-${p.slice(0, 12)}`} style={[bodyTextStyle, { marginBottom: pt(14) }]}>
            {p}
          </Text>
        ))}
      </View>
    );
  }

  if (payload.type === "about-eya") {
    const aboutEyaTheme = PROPOSAL_PRICING_OPTIONS_THEME;
    const aboutEyaBodyTextStyle = { ...layout.bodyText, color: aboutEyaTheme.text };
    return (
      <View style={layout.sectionBody}>
        {payload.showHeadline && payload.headline.trim() ? (
          <Text
            style={{
              fontFamily: FONT_SANS,
              fontSize: pt(20),
              fontWeight: 700,
              letterSpacing: -0.2,
              lineHeight: 1.15,
              marginBottom: pt(16),
              color: aboutEyaTheme.accent,
            }}
          >
            {stripMarkdownLinks(payload.headline)}
          </Text>
        ) : null}
        {payload.paragraphs.map((p, i) => (
          <Text key={`${i}-${p.slice(0, 12)}`} style={[aboutEyaBodyTextStyle, { marginBottom: pt(14) }]}>
            {stripMarkdownLinks(p)}
          </Text>
        ))}
      </View>
    );
  }

  if (payload.type === "project-scope") {
    return (
      <View style={layout.sectionBody}>
        {payload.blocks.map((b, i) => (
          <ScopeBlockBody
            // eslint-disable-next-line react/no-array-index-key
            key={`${i}-${b.kind}`}
            block={b}
            scheme={{ text: t.text, accent: t.accent }}
          />
        ))}
      </View>
    );
  }

  if (payload.type === "deliverables") {
    return (
      <View style={layout.sectionBody}>
        {payload.intro ? (
          <Text style={[bodyTextStyle, { marginBottom: pt(20) }]}>{payload.intro}</Text>
        ) : null}
        {payload.items.map((it) => (
          <Text key={it.id} style={[bodyTextStyle, { marginBottom: pt(10) }]}>
            {"\u2022"} {it.label}
          </Text>
        ))}
      </View>
    );
  }

  if (payload.type === "how-we-work") {
    return (
      <View style={layout.sectionBody}>
        {payload.pillars.map((p, i) => (
          <View key={`${i}-${p.tag}`} style={{ marginBottom: pt(22) }}>
            <Text style={[layout.monoUpper, { color: t.accent, marginBottom: pt(6) }]}>
              {p.tag}
            </Text>
            <Text
              style={{
                fontFamily: FONT_SANS,
                fontSize: pt(14),
                fontWeight: 700,
                marginBottom: pt(6),
                color: t.text,
              }}
            >
              {p.headline}
            </Text>
            <Text style={bodyTextStyle}>{p.desc}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (payload.type === "timeline") {
    return (
      <View style={layout.sectionBody}>
        {payload.startNote ? (
          <Text style={[bodyTextStyle, { marginBottom: pt(20) }]}>{payload.startNote}</Text>
        ) : null}
        {payload.phases.map((ph, i) => (
          <View key={ph.id} style={{ marginBottom: i < payload.phases.length - 1 ? pt(20) : 0 }}>
            <Text style={[layout.monoUpper, { color: t.accent, marginBottom: pt(4) }]}>{ph.duration}</Text>
            <Text style={{ fontFamily: FONT_SANS, fontSize: pt(14), fontWeight: 700, marginBottom: pt(6), color: t.text }}>
              {ph.name}
            </Text>
            <Text style={bodyTextStyle}>{ph.description}</Text>
          </View>
        ))}
      </View>
    );
  }

  if (payload.type === "decisions") {
    return (
      <View style={layout.sectionBody}>
        {payload.paragraphs.map((p, i) => (
          <Text key={`${i}-${p.slice(0, 12)}`} style={[bodyTextStyle, { marginBottom: pt(12) }]}>
            {p}
          </Text>
        ))}
      </View>
    );
  }

  if (payload.type === "next-steps") {
    return (
      <View style={layout.sectionBody}>
        {payload.steps.map((s, i) => (
          <Text key={`${i}-${s.slice(0, 14)}`} style={[bodyTextStyle, { marginBottom: pt(10) }]}>
            {i + 1}. {s}
          </Text>
        ))}
        <Text style={{ fontFamily: FONT_SANS, fontSize: pt(15), fontWeight: 700, marginTop: pt(10), color: t.text }}>
          {payload.cta}
        </Text>
        {payload.calLink ? (
          <Text style={{ fontFamily: FONT_MONO, fontSize: pt(10), color: t.accent, marginTop: pt(12) }}>
            {payload.calLink}
          </Text>
        ) : null}
      </View>
    );
  }

  if (payload.type === "terms") {
    // Terms should always use the dark scheme (same as investment pricelist),
    // even if the proposal theme is light/cream.
    const termsT = PROPOSAL_TERMS_THEME;
    return (
      <View style={layout.sectionBody}>
        <MultilineText
          text={payload.text || "—"}
          style={{ ...layout.bodyText, fontSize: pt(12), color: termsT.accent }}
        />
      </View>
    );
  }

  if (payload.type === "investment") {
    // handled by caller; keeps exhaustive matching predictable
    return null;
  }

  if (payload.type === "pricing-options") {
    // handled by caller
    return null;
  }

  if (payload.type === "team") {
    // handled by caller
    return null;
  }

  return null;
}

function getPageScheme(proposal: Proposal, page: ProposalPageModel) {
  if (page.kind === "cover") return PROPOSAL_COVER_STYLES;
  if (page.sectionType === "pricing-options") return PROPOSAL_PRICING_OPTIONS_THEME;
  if (page.sectionType === "about-eya") return PROPOSAL_PRICING_OPTIONS_THEME;
  if (page.sectionType === "investment") return PROPOSAL_PRICELIST_THEME;
  if (page.sectionType === "terms") return PROPOSAL_TERMS_THEME;
  return PROPOSAL_THEMES[proposal.theme];
}

function RenderSectionBody({ proposal, page }: { proposal: Proposal; page: Extract<ProposalPageModel, { kind: "section" }> }) {
  const payload = page.payload;
  const scheme = getPageScheme(proposal, page) as any;

  if (payload.type === "pricing-options") {
    return <PricingOptionsBody payload={payload} scheme={scheme} />;
  }

  if (payload.type === "investment") {
    return <InvestmentBody payload={payload} scheme={scheme} />;
  }

  if (payload.type === "team") {
    return <TeamBody payload={payload} scheme={scheme} clientName={proposal.meta.clientName} />;
  }

  return (
    <GenericSectionBody payload={payload} proposalTheme={proposal.theme} clientName={proposal.meta.clientName} />
  );
}

function CoverPage({ proposal }: { proposal: Proposal }) {
  const meta = proposal.meta;
  return (
    <Page size={A4_PAGE_SIZE_PT} style={[layout.coverPage, { backgroundColor: PROPOSAL_COVER_STYLES.bg }]}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={{ fontFamily: FONT_MONO, fontSize: pt(10), color: PDF_COVER_DETAIL, letterSpacing: 1, textTransform: "uppercase" as any }}>
          eyay.studio
        </Text>
        <Text style={{ fontFamily: FONT_MONO, fontSize: pt(10), color: PDF_COVER_DETAIL, letterSpacing: 1, textTransform: "uppercase" as any }}>
          {meta.proposalNumber || "—"}
        </Text>
      </View>
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
        {meta.projectName.trim() || "Project name"}
      </Text>

      <Text style={{ fontFamily: FONT_MONO, fontSize: pt(12), color: PDF_COVER_DETAIL, letterSpacing: 0.8, textTransform: "uppercase" as any, marginTop: pt(12) }}>
        {meta.clientName.trim() || "Client"}
      </Text>

      <View style={{ height: pt(48) }} />

      <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: pt(14), columnGap: pt(28) }}>
        {[
          ["Prepared by", meta.preparedBy || "eyay studio"],
          ["Prepared for", meta.clientName.trim() || "Client"],
          ["Date", fmtDate(meta.proposalDate)],
          ["Status", meta.proposalStatus || "—"],
          ["Valid until", fmtDate(meta.validUntil)],
          ["Contact", meta.studioContact || "—"],
        ].map(([label, value]) => (
          <View key={label} style={{ width: "47%" }}>
            <Text style={{ fontFamily: FONT_MONO, fontSize: pt(10), color: PDF_COVER_DETAIL, letterSpacing: 0.8, textTransform: "uppercase" as any, marginBottom: pt(4) }}>
              {label}
            </Text>
            <Text style={{ fontFamily: FONT_SANS, fontSize: pt(12), color: PROPOSAL_COVER_STYLES.text, letterSpacing: 0.2 }}>
              {value}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Text style={{ fontFamily: FONT_MONO, fontSize: pt(10), color: PDF_COVER_FOOTER_DETAIL, letterSpacing: 0.5 }}>
        {meta.studioEmail}
        {"\n"}
        {meta.studioAddress}
      </Text>
    </Page>
  );
}

export async function exportProposalTextPDF(proposal: Proposal): Promise<void> {
  const pages = buildProposalPages(proposal);
  registerPdfFontsOnce();

  const doc = (
    <Document>
      {pages.map((p, idx) => {
        if (p.kind === "cover") {
          return <CoverPage key={p.key} proposal={proposal} />;
        }

        const scheme = getPageScheme(proposal, p as any) as any;
        const showProjectName =
          p.kind === "section" && p.sectionType === "pricing-options";
        const lowOpacityPageNum =
          p.kind === "section" &&
          (p.sectionType === "pricing-options" ||
            p.sectionType === "investment" ||
            p.sectionType === "terms");
        return (
          <Page
            key={p.key}
            size={A4_PAGE_SIZE_PT}
            style={[
              layout.page,
              {
                backgroundColor: scheme.bg,
                color: scheme.text,
              },
            ]}
          >
            <Text style={[layout.headerLabel, { color: scheme.text }]}>
              {p.title}
              {p.continuation ? (
                <Text style={[layout.headerContinued, { color: scheme.accent }]}>{" "}(cont.)</Text>
              ) : null}
            </Text>
            {showProjectName ? (
              <Text
                style={{
                  fontFamily: FONT_SANS,
                  fontSize: pt(15),
                  fontWeight: 400,
                  letterSpacing: -0.1,
                  marginTop: pt(8),
                  color: scheme.accent,
                }}
              >
                {proposal.meta.projectName.trim() || "Project name"}
              </Text>
            ) : null}
            <View
              style={{
                width: pt(40),
                height: pt(4),
                backgroundColor: sectionHeaderStripeColor(scheme.bg),
                marginTop: pt(8),
                marginBottom: pt(20),
              }}
            />
            <RenderSectionBody proposal={proposal} page={p as any} />
            <Text style={[layout.pageNumber, { color: scheme.text, opacity: lowOpacityPageNum ? 0.35 : 0.3 }]}>
              {idx + 1} / {pages.length}
            </Text>
          </Page>
        );
      })}
    </Document>
  );

  const blob = await pdf(doc).toBlob();

  const num = proposal.meta.proposalNumber.replace(/[^\w.-]+/g, "-") || "draft";
  downloadBlob(blob, `eyay-proposal-${num}-text-a4.pdf`);
}


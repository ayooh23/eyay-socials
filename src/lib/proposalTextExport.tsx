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

/**
 * NOTE: Built-in Helvetica / Helvetica-Bold are used by default.
 *
 * Font.register() can be added here later for DM Sans / DM Mono, e.g.
 * Font.register({
 *   family: "DMSans",
 *   fonts: [{ src: "/fonts/DMSans-Regular.ttf" }, ...],
 * })
 * This block is intentionally kept as a placeholder for future work.
 */

const PX_TO_PT = 0.75; // because the existing layout used 794x1123 px for A4 preview

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

const layout = StyleSheet.create({
  page: {
    paddingTop: pt(60),
    paddingBottom: pt(48),
    paddingLeft: pt(60),
    paddingRight: pt(60),
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
  coverPage: {
    display: "flex",
    flexDirection: "column",
    paddingTop: pt(60),
    paddingBottom: pt(60),
    paddingLeft: pt(60),
    paddingRight: pt(60),
  },
  coverRule: {
    height: pt(2),
    width: "100%",
    marginTop: pt(12),
  },
  sectionRule: {
    height: 1,
    width: "100%",
    marginTop: pt(8),
    marginBottom: pt(18),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  headerLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: pt(14),
    letterSpacing: -0.1,
    fontWeight: 700,
  },
  headerContinued: {
    fontFamily: "Helvetica",
    fontSize: pt(12),
    fontWeight: 400,
  },
  sectionBody: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  bodyText: {
    fontFamily: "Helvetica",
    fontSize: pt(13),
    fontWeight: 300,
    lineHeight: 1.7,
  },
  monoMuted: {
    fontFamily: "Helvetica",
    fontSize: pt(10),
    fontWeight: 400,
    letterSpacing: 0.1,
    textTransform: "uppercase" as const,
  },
  monoUpper: {
    fontFamily: "Helvetica",
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

function SectionHeader({
  title,
  continued,
  textColor,
  ruleColor,
  mutedColor,
}: {
  title: string;
  continued: boolean;
  textColor: string;
  ruleColor: string;
  mutedColor: string;
}) {
  return (
    <View>
      <Text style={[layout.headerLabel, { color: textColor }]}>
        {title}
        {continued ? (
          <Text style={[layout.headerContinued, { color: mutedColor }]}>{" "}(continued)</Text>
        ) : null}
      </Text>
      <View style={[layout.sectionRule, { backgroundColor: ruleColor }]} />
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
              <Text style={[layout.monoMuted, { color: scheme.muted, marginBottom: pt(6) }]}>
                {d.optionATitle}
              </Text>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: pt(18),
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color: scheme.accent,
                }}
              >
                {d.summaryA}
              </Text>
            </View>

            <View
              style={{
                width: 1,
                backgroundColor: scheme.border,
                alignSelf: "stretch",
              }}
            />

            <View style={{ flex: 1, paddingLeft: pt(10) }}>
              <Text style={[layout.monoMuted, { color: scheme.muted, marginBottom: pt(6) }]}>
                {d.optionBTitle}
              </Text>
              <Text
                style={{
                  fontFamily: "Helvetica-Bold",
                  fontSize: pt(18),
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color: scheme.accent,
                }}
              >
                {d.summaryB}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: pt(20) }}>
            <Text style={[layout.monoMuted, { color: scheme.muted, marginBottom: pt(6) }]}>
              {d.optionATitle}
            </Text>
            <Text
              style={{
                fontFamily: "Helvetica-Bold",
                fontSize: pt(18),
                fontWeight: 700,
                letterSpacing: -0.2,
                color: scheme.accent,
              }}
            >
              {d.summaryA}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: "column", flex: 1 }}>
          <View style={{ flexDirection: "row", paddingBottom: pt(10), borderBottomWidth: 1, borderBottomColor: scheme.border }}>
            <View style={{ width: pt(180) }} />
            <View style={hasB ? { width: pt(170), paddingLeft: pt(10) } : { flex: 1, paddingLeft: pt(10) }}>
              <Text style={[layout.monoMuted, { color: scheme.muted }]}>{d.optionATitle.replace(/^Option [AB] — /i, "A — ")}</Text>
            </View>
            {hasB ? (
              <View style={{ width: pt(170), paddingLeft: pt(16), borderLeftWidth: 1, borderLeftColor: scheme.border }}>
                <Text style={[layout.monoMuted, { color: scheme.muted }]}>{d.optionBTitle.replace(/^Option [AB] — /i, "B — ")}</Text>
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
                borderBottomColor: scheme.border,
              }}
            >
              <View style={{ width: pt(180), paddingRight: pt(10) }}>
                <Text style={[layout.monoUpper, { color: scheme.muted }]}>{row.label}</Text>
              </View>
              <View style={hasB ? { width: pt(170), paddingRight: pt(10) } : { flex: 1, paddingRight: pt(10) }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: pt(13), fontWeight: 300, color: scheme.text }}>
                  {row.optionA}
                </Text>
              </View>
              {hasB ? (
                <View style={{ width: pt(170), paddingLeft: pt(16), borderLeftWidth: 1, borderLeftColor: scheme.border }}>
                  <Text style={{ fontFamily: "Helvetica", fontSize: pt(13), fontWeight: 300, color: scheme.text }}>
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
      <View style={{ marginBottom: pt(20), paddingBottom: pt(16), borderBottomWidth: 1, borderBottomColor: scheme.border }}>
        <Text style={[layout.monoUpper, { color: scheme.accent, marginBottom: pt(8) }]}>{d.optionATitle}</Text>
        <MultilineText text={d.narrativeA} style={{ ...layout.bodyText, color: scheme.text }} />
      </View>

      {hasB ? (
        <View style={{ marginBottom: pt(20) }}>
          <Text style={[layout.monoUpper, { color: scheme.accent, marginBottom: pt(8) }]}>{d.optionBTitle}</Text>
          <MultilineText text={d.narrativeB} style={{ ...layout.bodyText, color: scheme.text }} />
        </View>
      ) : null}

      <Text style={[layout.monoMuted, { color: scheme.muted, marginBottom: pt(8) }]}>
        {hasB ? "Both options include" : "Includes"}
      </Text>
      <MultilineText text={d.bothInclude} style={{ ...layout.bodyText, color: scheme.text, marginBottom: pt(16) }} />

      <Text style={[layout.monoMuted, { color: scheme.muted, marginBottom: pt(8) }]}>
        {hasB ? "Not included in either option" : "Not included"}
      </Text>
      <MultilineText text={d.notIncluded} style={{ ...layout.bodyText, color: scheme.text, marginBottom: pt(16) }} />

      <Text style={[layout.monoUpper, { color: scheme.muted, marginTop: pt(12), lineHeight: 1.6 }]}>
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

  // fixed column widths (points) to keep the table stable
  const descW = pt(220);
  const rateW = pt(110);
  const qtyW = pt(90);
  const totalW = pt(140);

  return (
    <View style={layout.sectionBody}>
      <View style={{ flexDirection: "column" }}>
        <View
          style={{
            flexDirection: "row",
            paddingBottom: pt(10),
            borderBottomWidth: 1,
            borderBottomColor: scheme.border,
          }}
        >
          <View style={{ width: descW }}>
            <Text style={[layout.monoMuted, { color: scheme.muted }]}>Description</Text>
          </View>
          <View style={{ width: rateW, alignItems: "flex-end" }}>
            <Text style={[layout.monoMuted, { color: scheme.muted }]}>Rate</Text>
          </View>
          <View style={{ width: qtyW, alignItems: "flex-end" }}>
            <Text style={[layout.monoMuted, { color: scheme.muted }]}>Qty</Text>
          </View>
          <View style={{ width: totalW, alignItems: "flex-end" }}>
            <Text style={[layout.monoMuted, { color: scheme.muted }]}>Total</Text>
          </View>
        </View>

        {rows.map((r) => {
          const total = r.price * r.quantity;
          return (
            <View
              key={r.id}
              style={{
                flexDirection: "row",
                paddingTop: pt(12),
                paddingBottom: pt(12),
                borderBottomWidth: 1,
                borderBottomColor: scheme.border,
              }}
            >
              <View style={{ width: descW, paddingRight: pt(10) }}>
                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: pt(13), fontWeight: 700, color: scheme.text }}>
                  {r.label}
                </Text>
                <Text style={{ fontFamily: "Helvetica", fontSize: pt(11), fontWeight: 300, color: scheme.muted, marginTop: pt(4), lineHeight: 1.6 }}>
                  {r.description}
                </Text>
              </View>
              <View style={{ width: rateW, alignItems: "flex-end", paddingRight: pt(10) }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: pt(12), fontWeight: 400, color: scheme.text }}>
                  {formatPriceCell(r.price, r.unit)}
                </Text>
              </View>
              <View style={{ width: qtyW, alignItems: "flex-end" }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: pt(12), fontWeight: 400, color: scheme.text }}>
                  {r.quantity}
                </Text>
              </View>
              <View style={{ width: totalW, alignItems: "flex-end" }}>
                <Text style={{ fontFamily: "Helvetica", fontSize: pt(12), fontWeight: 400, color: scheme.text }}>
                  {formatEuro(total)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={[layout.monoMuted, { color: scheme.muted, marginTop: pt(12) }]}>{payload.vatNote}</Text>
      <Text style={[layout.monoUpper, { color: scheme.muted, marginTop: pt(8), lineHeight: 1.6 }]}>
        Payment terms: {payload.paymentTerms}
      </Text>
    </View>
  );
}

function TeamBody({
  payload,
  scheme,
  clientName,
  proposalTheme,
}: {
  payload: Extract<SectionPagePayload, { type: "team" }>;
  scheme: { bg: string; text: string; muted: string; accent: string; border: string };
  clientName: string;
  proposalTheme: Proposal["theme"];
}) {
  function clientSectionLabelColor(theme: Proposal["theme"]): string {
    if (theme === "dark") return "#5eead4";
    if (theme === "light") return "#0f766e";
    return "#115e59";
  }

  const TEAM_STUDIO_BG = "#0000FF";
  const TEAM_CLIENT_BG = "#ffffff";

  return (
    <View style={layout.sectionBody}>
      {(() => {
        let shownStudio = false;
        let shownClient = false;

        return payload.members.map((m) => {
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
                      color: isClient
                        ? clientSectionLabelColor(proposalTheme)
                        : scheme.muted,
                      marginBottom: pt(10),
                    },
                  ]}
                >
                  {isClient ? `${clientName.trim() || "Client"} team` : "eyay studio"}
                </Text>
              ) : null}

              <View
                style={{
                  position: "relative",
                  padding: pt(16),
                  backgroundColor: isClient ? TEAM_CLIENT_BG : TEAM_STUDIO_BG,
                  borderRadius: 4,
                  borderWidth: 1,
                  borderColor: isClient ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.28)",
                }}
              >
                {isClient ? (
                  <View style={{ position: "absolute", top: pt(12), right: pt(12) }}>
                    <Text
                      style={{
                        fontFamily: "Helvetica",
                        fontSize: pt(8),
                        letterSpacing: 0.14,
                        textTransform: "uppercase",
                        color: "#0d9488",
                        opacity: 0.9,
                      }}
                    >
                      Client
                    </Text>
                  </View>
                ) : null}

                <Text style={{ fontFamily: "Helvetica-Bold", fontSize: pt(15), fontWeight: 600, color: nameColor }}>
                  {m.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "Helvetica",
                    fontSize: pt(10),
                    letterSpacing: 0.1,
                    textTransform: "uppercase",
                    color: roleColor,
                    marginTop: pt(4),
                  }}
                >
                  {m.role}
                </Text>
                <Text
                  style={{
                    fontFamily: "Helvetica",
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
        });
      })()}
    </View>
  );
}

function ScopeBlockBody({
  block,
  scheme,
}: {
  block: Extract<SectionPagePayload, { type: "project-scope" }>["blocks"][number];
  scheme: { text: string; muted: string; accent: string };
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
            fontFamily: "Helvetica-Bold",
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
            fontFamily: "Helvetica-Bold",
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
          fontFamily: "Helvetica-Bold",
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
                fontFamily: "Helvetica",
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
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: pt(14), fontWeight: 600, marginBottom: pt(4), color: scheme.text }}>
              {s.title}
            </Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: pt(13), fontWeight: 300, color: scheme.text }}>
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
    return (
      <View style={layout.sectionBody}>
        {payload.showHeadline && payload.headline.trim() ? (
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: pt(18),
              fontWeight: 700,
              letterSpacing: -0.2,
              lineHeight: 1.15,
              marginBottom: pt(16),
              color: t.accent,
            }}
          >
            {stripMarkdownLinks(payload.headline)}
          </Text>
        ) : null}
        {payload.paragraphs.map((p, i) => (
          <Text key={`${i}-${p.slice(0, 12)}`} style={[bodyTextStyle, { marginBottom: pt(14) }]}>
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
            scheme={{ text: t.text, muted: t.muted, accent: t.accent }}
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
                fontFamily: "Helvetica-Bold",
                fontSize: pt(14),
                fontWeight: 600,
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
            <Text style={[layout.monoUpper, { color: t.muted, marginBottom: pt(4) }]}>{ph.duration}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: pt(14), fontWeight: 600, marginBottom: pt(6), color: t.text }}>
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
        <Text style={{ fontFamily: "Helvetica-Bold", fontSize: pt(15), fontWeight: 600, marginTop: pt(10), color: t.text }}>
          {payload.cta}
        </Text>
        {payload.calLink ? (
          <Text style={{ fontFamily: "Helvetica", fontSize: pt(10), color: t.accent, marginTop: pt(12) }}>
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
          style={{ ...layout.bodyText, fontSize: pt(12), color: termsT.muted }}
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
    return <TeamBody payload={payload} scheme={scheme} clientName={proposal.meta.clientName} proposalTheme={proposal.theme} />;
  }

  return (
    <GenericSectionBody payload={payload} proposalTheme={proposal.theme} clientName={proposal.meta.clientName} />
  );
}

function CoverPage({ proposal }: { proposal: Proposal }) {
  const meta = proposal.meta;
  return (
    <Page size="A4" style={[layout.coverPage, { backgroundColor: PROPOSAL_COVER_STYLES.bg }]} wrap={false}>
      <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "baseline" }}>
        <Text style={{ fontFamily: "Helvetica", fontSize: pt(10), color: PROPOSAL_COVER_STYLES.muted, letterSpacing: 1, textTransform: "uppercase" as any }}>
          eyay.studio
        </Text>
      </View>
      <View style={[layout.coverRule, { backgroundColor: PROPOSAL_COVER_STYLES.rule }]} />

      <View style={{ height: pt(48) }} />

      <Text
        style={{
          fontFamily: "Helvetica-Bold",
          fontSize: pt(48),
          fontWeight: 700,
          letterSpacing: -0.2,
          lineHeight: 1.05,
          color: PROPOSAL_COVER_STYLES.text,
        }}
      >
        {meta.projectName.trim() || "Project name"}
      </Text>

      <View style={{ marginTop: pt(14) }}>
        <View style={{ flexDirection: "row" }}>
          <View style={{ flex: 1, paddingRight: pt(12) }}>
            <Text style={{ fontFamily: "Helvetica", fontSize: pt(10), color: PROPOSAL_COVER_STYLES.muted, letterSpacing: 1, textTransform: "uppercase" as any }}>
              Client
            </Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: pt(12), color: PROPOSAL_COVER_STYLES.text, marginTop: pt(6) }}>
              {meta.clientName.trim() || "Client"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: "Helvetica", fontSize: pt(10), color: PROPOSAL_COVER_STYLES.muted, letterSpacing: 1, textTransform: "uppercase" as any }}>
              Date
            </Text>
            <Text style={{ fontFamily: "Helvetica", fontSize: pt(12), color: PROPOSAL_COVER_STYLES.text, marginTop: pt(6) }}>
              {fmtDate(meta.proposalDate)}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: pt(14) }}>
          <Text style={{ fontFamily: "Helvetica", fontSize: pt(10), color: PROPOSAL_COVER_STYLES.muted, letterSpacing: 1, textTransform: "uppercase" as any }}>
            Status
          </Text>
          <Text style={{ fontFamily: "Helvetica", fontSize: pt(12), color: PROPOSAL_COVER_STYLES.text, marginTop: pt(6) }}>
            {meta.proposalStatus || "—"}
          </Text>
        </View>
      </View>
    </Page>
  );
}

export async function exportProposalTextPDF(proposal: Proposal): Promise<void> {
  const pages = buildProposalPages(proposal);

  // react-pdf Font.register() should be called once (at module init),
  // but we keep it intentionally empty for now (Helvetica built-in).
  // eslint-disable-next-line no-unused-vars
  const _noop = Font;

  const doc = (
    <Document>
      {pages.map((p) => {
        if (p.kind === "cover") {
          return <CoverPage key={p.key} proposal={proposal} />;
        }

        const scheme = getPageScheme(proposal, p as any) as any;
        return (
          <Page
            key={p.key}
            size="A4"
            style={[
              layout.page,
              {
                backgroundColor: scheme.bg,
                color: scheme.text,
              },
            ]}
            wrap={false}
          >
            <SectionHeader
              title={p.title}
              continued={p.continuation}
              textColor={scheme.text}
              mutedColor={scheme.muted}
              ruleColor={scheme.border}
            />
            <RenderSectionBody proposal={proposal} page={p as any} />
          </Page>
        );
      })}
    </Document>
  );

  const blob = await pdf(doc).toBlob();

  const num = proposal.meta.proposalNumber.replace(/[^\w.-]+/g, "-") || "draft";
  downloadBlob(blob, `eyay-proposal-${num}.pdf`);
}


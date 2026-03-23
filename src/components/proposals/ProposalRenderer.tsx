import type { CSSProperties } from "react";
import type {
  Proposal,
  ProposalPageModel,
  ProposalTheme,
  ScopeRenderBlock,
  SectionPagePayload,
  TeamMember,
  TeamMemberSide,
} from "@/lib/proposalTypes";
import {
  PROPOSAL_COVER_STYLES,
  PROPOSAL_PRICELIST_THEME,
  PROPOSAL_PRICING_OPTIONS_THEME,
  PROPOSAL_TERMS_THEME,
  PROPOSAL_THEMES,
} from "@/lib/proposalThemes";

const W = 794;
const H = 1123;
const M = 60;

const COVER = PROPOSAL_COVER_STYLES;

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

export function formatEuro(n: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPriceCell(
  price: number,
  unit: "fixed" | "monthly" | "daily",
): string {
  if (unit === "monthly") return `${formatEuro(price)}/mo`;
  if (unit === "daily") return `${formatEuro(price)}/day`;
  if (price <= 0) return "Custom";
  return formatEuro(price);
}

function stripMarkdownLinks(s: string): string {
  // Converts `[label](url)` -> `label` for this renderer.
  return s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export interface ProposalRendererProps {
  proposal: Proposal;
  page: ProposalPageModel;
  pageIndex: number;
  totalPages: number;
}

export default function ProposalRenderer({
  proposal,
  page,
  pageIndex,
  totalPages,
}: ProposalRendererProps) {
  const t = PROPOSAL_THEMES[proposal.theme];
  const { meta } = proposal;

  const sans = "var(--font-dm-sans), system-ui, sans-serif";
  const mono = "var(--font-dm-mono), ui-monospace, monospace";

  const pageNum = pageIndex + 1;

  if (page.kind === "cover") {
    return (
      <div
        data-proposal-page
        style={{
          width: W,
          height: H,
          background: COVER.bg,
          color: COVER.text,
          position: "relative",
          boxSizing: "border-box",
          padding: M,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            fontFamily: mono,
            fontSize: 10,
            color: COVER.muted,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          <span>eyay.studio</span>
          <span>{meta.proposalNumber || "—"}</span>
        </div>
        <div
          style={{
            height: 2,
            background: COVER.rule,
            marginTop: 12,
            width: "100%",
          }}
        />
        <div style={{ height: 48 }} />
        <h1
          style={{
            fontFamily: sans,
            fontSize: 48,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            margin: 0,
            color: COVER.text,
          }}
        >
          {meta.projectName.trim() || "Project name"}
        </h1>
        <div
          style={{
            marginTop: 12,
            fontFamily: mono,
            fontSize: 12,
            fontWeight: 400,
            color: COVER.muted,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {meta.clientName.trim() || "Client"}
        </div>
        <div style={{ height: 48 }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px 28px",
            fontFamily: mono,
            fontSize: 10,
            color: COVER.muted,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          <div>
            <div style={{ opacity: 0.85, marginBottom: 4 }}>Prepared by</div>
            <div
              style={{
                color: COVER.text,
                textTransform: "none",
                letterSpacing: "0.04em",
              }}
            >
              {meta.preparedBy || "eyay studio"}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.85, marginBottom: 4 }}>Prepared for</div>
            <div
              style={{
                color: COVER.text,
                textTransform: "none",
                letterSpacing: "0.04em",
              }}
            >
              {meta.clientName.trim() || "Client"}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.85, marginBottom: 4 }}>Date</div>
            <div style={{ color: COVER.text }}>{fmtDate(meta.proposalDate)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.85, marginBottom: 4 }}>Status</div>
            <div
              style={{
                color: COVER.text,
                textTransform: "none",
                letterSpacing: "0.04em",
              }}
            >
              {meta.proposalStatus || "—"}
            </div>
          </div>
          <div>
            <div style={{ opacity: 0.85, marginBottom: 4 }}>Valid until</div>
            <div style={{ color: COVER.text }}>{fmtDate(meta.validUntil)}</div>
          </div>
          <div>
            <div style={{ opacity: 0.85, marginBottom: 4 }}>Contact</div>
            <div
              style={{
                color: COVER.text,
                textTransform: "none",
                letterSpacing: "0.02em",
              }}
            >
              {meta.studioContact}
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: COVER.footer,
            letterSpacing: "0.06em",
          }}
        >
          {meta.studioEmail}
          <br />
          {meta.studioAddress}
        </div>
      </div>
    );
  }

  const { title, continuation, payload } = page;
  const isPricingPage =
    page.kind === "section" && page.sectionType === "pricing-options";
  const isAboutEyaPage =
    page.kind === "section" && page.sectionType === "about-eya";
  const isPricelistPage =
    page.kind === "section" && page.sectionType === "investment";
  const isTermsPage =
    page.kind === "section" && page.sectionType === "terms";
  const showInvestmentProjectName =
    page.kind === "section" && page.sectionType === "pricing-options";
  const investmentProjectLabel =
    meta.projectName.trim() || "Project name";
  const pt = isPricingPage || isAboutEyaPage
    ? PROPOSAL_PRICING_OPTIONS_THEME
    : isPricelistPage
      ? PROPOSAL_PRICELIST_THEME
      : isTermsPage
        ? PROPOSAL_TERMS_THEME
        : t;

  return (
    <div
      data-proposal-page
      style={{
        width: W,
        height: H,
        background: pt.bg,
        color: pt.text,
        position: "relative",
        boxSizing: "border-box",
        padding: M,
        paddingBottom: 48,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          fontFamily: sans,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: 0,
          lineHeight: 1.15,
          color: pt.text,
        }}
      >
        {title}
        {continuation ? (
          <span style={{ color: pt.muted, fontWeight: 400, fontSize: 14 }}>
            {" "}
            (cont.)
          </span>
        ) : null}
        {showInvestmentProjectName ? (
          <span
            style={{
              display: "block",
              marginTop: 8,
              fontSize: 15,
              fontWeight: 400,
              letterSpacing: "-0.01em",
              color: pt.muted,
            }}
          >
            {investmentProjectLabel}
          </span>
        ) : null}
      </h2>
      <div
        style={{
          width: 40,
          height: 4,
          background: pt.accent,
          marginTop: 8,
        }}
      />
      <div style={{ height: 24 }} />
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <SectionBody
          payload={payload}
          t={pt}
          sans={sans}
          mono={mono}
          theme={proposal.theme}
          clientName={meta.clientName}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: M,
          right: M,
          fontFamily: mono,
          fontSize: 10,
          color: pt.text,
          opacity:
            isPricingPage || isPricelistPage || isTermsPage ? 0.35 : 0.3,
        }}
      >
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

function ScopeBlock({
  block,
  t,
  sans,
  mono,
  bodyStyle,
}: {
  block: ScopeRenderBlock;
  t: (typeof PROPOSAL_THEMES)["dark"];
  sans: string;
  mono: string;
  bodyStyle: CSSProperties;
}) {
  if (block.kind === "product") {
    return (
      <div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 10,
          }}
        >
          {block.title}
        </div>
        <div style={{ ...bodyStyle, whiteSpace: "pre-wrap" }}>{block.body}</div>
      </div>
    );
  }
  if (block.kind === "bullets") {
    return (
      <div>
        <div
          style={{
            fontFamily: sans,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          {block.title}
        </div>
        {block.intro.trim() ? (
          <p style={{ ...bodyStyle, margin: "0 0 12px" }}>{block.intro}</p>
        ) : null}
        <ul style={{ margin: 0, paddingLeft: 18, ...bodyStyle }}>
          {block.items.map((it, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              {it}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 16,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          marginBottom: 8,
        }}
      >
        {block.title}
      </div>
      {block.intro.trim() ? (
        <p style={{ ...bodyStyle, margin: "0 0 14px" }}>{block.intro}</p>
      ) : null}
      <ol style={{ margin: 0, paddingLeft: 20, ...bodyStyle, listStyle: "none" as const }}>
        {block.steps.map((s, i) => (
          <li key={i} style={{ marginBottom: 14, position: "relative", paddingLeft: 0 }}>
            <span
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: t.accent,
                letterSpacing: "0.08em",
                display: "block",
                marginBottom: 4,
              }}
            >
              {i + 1}.
            </span>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{s.title}</div>
            <div style={{ fontWeight: 300 }}>{s.detail}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}

const TEAM_STUDIO_BG = "#0000FF";
const TEAM_CLIENT_BG = "#ffffff";

function teamMemberCardStyle(side: TeamMemberSide): CSSProperties {
  if (side === "studio") {
    return {
      padding: 16,
      background: TEAM_STUDIO_BG,
      border: "1px solid rgba(255,255,255,0.28)",
      borderRadius: 4,
    };
  }
  return {
    padding: 16,
    background: TEAM_CLIENT_BG,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 4,
    boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
  };
}

/** Section labels above team groups */
function clientSectionLabelColor(theme: ProposalTheme): string {
  if (theme === "dark") return "#5eead4";
  if (theme === "light") return "#0f766e";
  return "#115e59";
}

function SectionBody({
  payload,
  t,
  sans,
  mono,
  theme,
  clientName,
}: {
  payload: SectionPagePayload;
  t: (typeof PROPOSAL_THEMES)["dark"];
  sans: string;
  mono: string;
  theme: ProposalTheme;
  clientName: string;
}) {
  const bodyStyle: CSSProperties = {
    fontFamily: sans,
    fontSize: 13,
    fontWeight: 300,
    lineHeight: 1.7,
    color: t.text,
  };

  if (payload.type === "about") {
    return (
      <div style={bodyStyle}>
        {payload.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: "0 0 14px" }}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  if (payload.type === "about-eya") {
    return (
      <div style={bodyStyle}>
        {payload.showHeadline && payload.headline.trim() ? (
          <div
            style={{
              fontFamily: sans,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              marginBottom: 14,
              color: t.accent,
            }}
          >
            {stripMarkdownLinks(payload.headline)}
          </div>
        ) : null}
        {payload.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: "0 0 14px" }}>
            {stripMarkdownLinks(p)}
          </p>
        ))}
      </div>
    );
  }

  if (payload.type === "project-scope") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {payload.blocks.map((b, i) => (
          <ScopeBlock key={i} block={b} t={t} sans={sans} mono={mono} bodyStyle={bodyStyle} />
        ))}
      </div>
    );
  }

  if (payload.type === "pricing-options") {
    const d = payload.data;
    const hasB = !!d.optionBEnabled;
    if (payload.slice === "compare") {
      return (
        <div>
          {d.intro.trim() ? (
            <p style={{ ...bodyStyle, margin: "0 0 18px" }}>{d.intro}</p>
          ) : null}
          {hasB ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr",
                gap: 0,
                marginBottom: 20,
                alignItems: "stretch",
              }}
            >
              <div style={{ paddingRight: 20 }}>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: t.muted,
                    marginBottom: 6,
                  }}
                >
                  {d.optionATitle}
                </div>
                <div
                  style={{
                    fontFamily: sans,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: t.accent,
                  }}
                >
                  {d.summaryA}
                </div>
              </div>
              <div
                style={{
                  width: 1,
                  background: t.border,
                  minHeight: "100%",
                  alignSelf: "stretch",
                }}
                aria-hidden
              />
              <div style={{ paddingLeft: 20 }}>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: t.muted,
                    marginBottom: 6,
                  }}
                >
                  {d.optionBTitle}
                </div>
                <div
                  style={{
                    fontFamily: sans,
                    fontSize: 18,
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    color: t.accent,
                  }}
                >
                  {d.summaryB}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 20, paddingRight: 20 }}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: t.muted,
                  marginBottom: 6,
                }}
              >
                {d.optionATitle}
              </div>
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: t.accent,
                }}
              >
                {d.summaryA}
              </div>
            </div>
          )}

          {hasB ? (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    fontFamily: mono,
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: t.muted,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <th style={{ textAlign: "left", padding: "0 10px 10px 0", fontWeight: 400 }}>
                    {""}
                  </th>
                  <th style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 400, width: "34%" }}>
                    {d.optionATitle.replace(/^Option [AB] — /i, "A — ")}
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0 0 10px 16px",
                      fontWeight: 400,
                      width: "34%",
                      borderLeft: `1px solid ${t.border}`,
                    }}
                  >
                    {d.optionBTitle.replace(/^Option [AB] — /i, "B — ")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: `1px solid ${t.border}`,
                      fontFamily: sans,
                      fontWeight: 300,
                      verticalAlign: "top",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 10px 10px 0",
                        fontFamily: mono,
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: t.muted,
                        width: "28%",
                      }}
                    >
                      {row.label}
                    </td>
                    <td style={{ padding: "10px 8px 10px 0", color: t.text }}>{row.optionA}</td>
                    <td
                      style={{
                        padding: "10px 0 10px 16px",
                        color: t.text,
                        borderLeft: `1px solid ${t.border}`,
                      }}
                    >
                      {row.optionB}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    fontFamily: mono,
                    fontSize: 9,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: t.muted,
                    borderBottom: `1px solid ${t.border}`,
                  }}
                >
                  <th style={{ textAlign: "left", padding: "0 10px 10px 0", fontWeight: 400 }}>
                    {""}
                  </th>
                  <th style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 400, width: "72%" }}>
                    {d.optionATitle.replace(/^Option [AB] — /i, "A — ")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {d.rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      borderBottom: `1px solid ${t.border}`,
                      fontFamily: sans,
                      fontWeight: 300,
                      verticalAlign: "top",
                    }}
                  >
                    <td
                      style={{
                        padding: "10px 10px 10px 0",
                        fontFamily: mono,
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        color: t.muted,
                        width: "28%",
                      }}
                    >
                      {row.label}
                    </td>
                    <td style={{ padding: "10px 8px 10px 0", color: t.text }}>{row.optionA}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      );
    }
    return (
      <div>
        <div
          style={{
            marginBottom: 20,
            paddingBottom: 20,
            borderBottom: `1px solid ${t.border}`,
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: t.accent,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 8,
            }}
          >
            {d.optionATitle}
          </div>
          <div style={{ ...bodyStyle, whiteSpace: "pre-wrap" }}>{d.narrativeA}</div>
        </div>
        {hasB ? (
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                color: t.accent,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              {d.optionBTitle}
            </div>
            <div style={{ ...bodyStyle, whiteSpace: "pre-wrap" }}>{d.narrativeB}</div>
          </div>
        ) : null}
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: t.muted,
            marginBottom: 8,
          }}
        >
          {hasB ? "Both options include" : "Includes"}
        </div>
        <div style={{ ...bodyStyle, marginBottom: 16, whiteSpace: "pre-wrap" }}>
          {d.bothInclude}
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: t.muted,
            marginBottom: 8,
          }}
        >
          {hasB ? "Not included in either option" : "Not included"}
        </div>
        <div style={{ ...bodyStyle, marginBottom: 16, whiteSpace: "pre-wrap" }}>
          {d.notIncluded}
        </div>
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: t.muted,
            marginTop: 12,
            lineHeight: 1.6,
          }}
        >
          Payment terms: {d.paymentTerms}
        </div>
      </div>
    );
  }

  if (payload.type === "decisions") {
    return (
      <div style={bodyStyle}>
        {payload.paragraphs.map((p, i) => (
          <p key={i} style={{ margin: "0 0 12px" }}>
            {p}
          </p>
        ))}
      </div>
    );
  }

  if (payload.type === "deliverables") {
    return (
      <div>
        {payload.intro ? (
          <p style={{ ...bodyStyle, margin: "0 0 20px" }}>{payload.intro}</p>
        ) : null}
        <ul style={{ margin: 0, paddingLeft: 18, ...bodyStyle }}>
          {payload.items.map((it) => (
            <li key={it.id} style={{ marginBottom: 10 }}>
              {it.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (payload.type === "how-we-work") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {payload.pillars.map((p, i) => (
          <div key={i}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: t.accent,
                marginBottom: 6,
              }}
            >
              {p.tag}
            </div>
            <div
              style={{
                fontFamily: sans,
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              {p.headline}
            </div>
            <div style={bodyStyle}>{p.desc}</div>
          </div>
        ))}
      </div>
    );
  }

  if (payload.type === "timeline") {
    const phases = payload.phases;
    return (
      <div>
        {payload.startNote ? (
          <p style={{ ...bodyStyle, margin: "0 0 20px" }}>{payload.startNote}</p>
        ) : null}
        <div style={{ position: "relative", paddingLeft: 20 }}>
          {phases.map((ph, i) => (
            <div
              key={ph.id}
              style={{
                position: "relative",
                paddingBottom: i < phases.length - 1 ? 20 : 0,
                paddingLeft: 14,
              }}
            >
              {i < phases.length - 1 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 3,
                    top: 10,
                    bottom: 0,
                    width: 1,
                    background: t.border,
                  }}
                />
              ) : null}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 4,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: t.accent,
                }}
              />
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: t.muted,
                  marginBottom: 4,
                }}
              >
                {ph.duration}
              </div>
              <div
                style={{
                  fontFamily: sans,
                  fontSize: 14,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                {ph.name}
              </div>
              <div style={bodyStyle}>{ph.description}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (payload.type === "investment") {
    const rows = payload.items.filter((r) => r.included);
    return (
      <div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
          }}
        >
          <thead>
            <tr
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: t.muted,
                borderBottom: `1px solid ${t.border}`,
              }}
            >
              <th style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 400 }}>
                Label
              </th>
              <th style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 400 }}>
                Description
              </th>
              <th style={{ textAlign: "right", padding: "0 0 10px", fontWeight: 400 }}>
                Qty
              </th>
              <th style={{ textAlign: "right", padding: "0 0 10px", fontWeight: 400 }}>
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                style={{
                  borderBottom: `1px solid ${t.border}`,
                  fontFamily: sans,
                  fontWeight: 300,
                  verticalAlign: "top",
                }}
              >
                <td style={{ padding: "12px 8px 12px 0", width: "22%" }}>{r.label}</td>
                <td style={{ padding: "12px 8px", color: t.muted }}>{r.description}</td>
                <td
                  style={{
                    padding: "12px 8px",
                    textAlign: "right",
                    fontFamily: mono,
                    fontSize: 11,
                  }}
                >
                  {r.quantity}
                </td>
                <td
                  style={{
                    padding: "12px 0 12px 8px",
                    textAlign: "right",
                    fontFamily: mono,
                    fontSize: 12,
                  }}
                >
                  {formatPriceCell(r.price, r.unit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div
          style={{
            marginTop: 12,
            fontFamily: mono,
            fontSize: 10,
            color: t.muted,
            letterSpacing: "0.04em",
          }}
        >
          {payload.vatNote}
        </div>
        <div
          style={{
            marginTop: 8,
            fontFamily: mono,
            fontSize: 10,
            color: t.muted,
          }}
        >
          Payment terms: {payload.paymentTerms}
        </div>
      </div>
    );
  }

  if (payload.type === "team") {
    let shownStudio = false;
    let shownClient = false;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {payload.members.map((m: TeamMember) => {
          const isClient = m.side === "client";
          const showLabel =
            (isClient && !shownClient) || (!isClient && !shownStudio);
          if (isClient) shownClient = true;
          else shownStudio = true;
          const nameColor = isClient ? "#0a0a0a" : "#ffffff";
          const roleColor = isClient ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.7)";
          const bioColor = isClient ? "#1a1a1a" : "rgba(255,255,255,0.92)";
          return (
            <div key={m.id}>
              {showLabel ? (
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: isClient ? clientSectionLabelColor(theme) : t.muted,
                    marginBottom: 10,
                  }}
                >
                  {isClient
                    ? `${clientName.trim() || "Client"} team`
                    : "eyay studio"}
                </div>
              ) : null}
              <div style={{ position: "relative", ...teamMemberCardStyle(m.side) }}>
                {isClient ? (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      fontFamily: mono,
                      fontSize: 8,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      color: "#0d9488",
                      opacity: 0.9,
                    }}
                  >
                    Client
                  </span>
                ) : null}
                <div
                  style={{
                    fontFamily: sans,
                    fontSize: 15,
                    fontWeight: 600,
                    color: nameColor,
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: roleColor,
                    marginTop: 4,
                  }}
                >
                  {m.role}
                </div>
                <p
                  style={{
                    fontFamily: sans,
                    fontSize: 13,
                    fontWeight: 300,
                    lineHeight: 1.7,
                    color: bioColor,
                    margin: "12px 0 0",
                  }}
                >
                  {m.bio}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (payload.type === "next-steps") {
    return (
      <div>
        <ol style={{ ...bodyStyle, margin: "0 0 20px", paddingLeft: 18 }}>
          {payload.steps.map((s, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              {s}
            </li>
          ))}
        </ol>
        <p style={{ fontFamily: sans, fontSize: 15, fontWeight: 600, margin: 0 }}>
          {payload.cta}
        </p>
        {payload.calLink ? (
          <p
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: t.accent,
              marginTop: 12,
              wordBreak: "break-all",
            }}
          >
            {payload.calLink}
          </p>
        ) : null}
      </div>
    );
  }

  if (payload.type === "terms") {
    return (
      <div
        style={{
          ...bodyStyle,
          color: t.muted,
          fontSize: 12,
          whiteSpace: "pre-wrap",
        }}
      >
        {payload.text || "—"}
      </div>
    );
  }

  return null;
}

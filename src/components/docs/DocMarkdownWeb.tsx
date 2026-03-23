"use client";

import type { ReactNode } from "react";
import type { Token } from "marked";
import type { Tokens } from "marked";
import { lexDocMarkdown } from "@/lib/docMarkdownLex";
import {
  PROPOSAL_PRICING_OPTIONS_THEME,
  PROPOSAL_THEMES,
} from "@/lib/proposalThemes";

type Variant = "light" | "aboutEya";

function palette(v: Variant) {
  if (v === "aboutEya") {
    const t = PROPOSAL_PRICING_OPTIONS_THEME;
    return {
      text: t.text,
      muted: t.muted,
      accent: t.accent,
      link: "rgba(255,255,255,0.95)",
      codeBg: "rgba(255,255,255,0.12)",
      border: t.border,
    };
  }
  const t = PROPOSAL_THEMES.light;
  return {
    text: t.text,
    muted: t.muted,
    accent: t.accent,
    link: t.accent,
    codeBg: t.surface,
    border: t.border,
  };
}

function renderInline(
  tokens: Token[] | undefined,
  v: Variant,
  keyBase: string,
): ReactNode[] {
  if (!tokens?.length) return [];
  const c = palette(v);
  return tokens.map((t, i) => {
    const k = `${keyBase}-i${i}`;
    switch (t.type) {
      case "text":
        return (
          <span key={k}>{(t as Tokens.Text).text}</span>
        );
      case "strong":
        return (
          <strong key={k} style={{ fontWeight: 700 }}>
            {renderInline((t as Tokens.Strong).tokens, v, k)}
          </strong>
        );
      case "em":
        return (
          <em key={k} style={{ fontStyle: "italic" }}>
            {renderInline((t as Tokens.Em).tokens, v, k)}
          </em>
        );
      case "del":
        return (
          <del key={k}>
            {renderInline((t as Tokens.Del).tokens, v, k)}
          </del>
        );
      case "codespan":
        return (
          <code
            key={k}
            style={{
              fontFamily: "var(--font-dm-mono), ui-monospace, monospace",
              fontSize: "0.9em",
              background: c.codeBg,
              padding: "1px 5px",
              borderRadius: 4,
              border: `1px solid ${c.border}`,
            }}
          >
            {(t as Tokens.Codespan).text}
          </code>
        );
      case "link": {
        const L = t as Tokens.Link;
        return (
          <a
            key={k}
            href={L.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: c.link, textDecoration: "underline" }}
          >
            {renderInline(L.tokens, v, k)}
          </a>
        );
      }
      case "image": {
        const Im = t as Tokens.Image;
        return (
          <span key={k} style={{ color: c.muted, fontSize: 12 }}>
            [{Im.text || "image"}]
          </span>
        );
      }
      case "br":
        return <br key={k} />;
      case "escape":
        return (
          <span key={k}>{(t as Tokens.Escape).text}</span>
        );
      default:
        return (
          <span key={k} style={{ color: c.muted }}>
            {(t as Tokens.Generic).raw}
          </span>
        );
    }
  });
}

function renderListItem(
  item: Tokens.ListItem,
  v: Variant,
  key: string,
  density: "body" | "headline",
) {
  const c = palette(v);
  return (
    <li
      key={key}
      style={{
        marginBottom: 6,
        paddingLeft: 4,
        color: c.text,
      }}
    >
      {item.task ? (
        <span style={{ marginRight: 6, opacity: 0.7 }}>
          {item.checked ? "☑" : "☐"}
        </span>
      ) : null}
      {item.tokens.map((child, i) =>
        renderListChild(child, v, `${key}-c${i}`, density),
      )}
    </li>
  );
}

function renderListChild(
  token: Token,
  v: Variant,
  key: string,
  density: "body" | "headline",
): ReactNode {
  if (token.type === "paragraph") {
    const p = token as Tokens.Paragraph;
    return (
      <div key={key} style={{ display: "block", width: "100%" }}>
        {renderInline(p.tokens, v, key)}
      </div>
    );
  }
  if (token.type === "list") {
    return (
      <div key={key} style={{ marginTop: 8 }}>
        {renderBlock(token, v, key, density)}
      </div>
    );
  }
  if (token.type === "text") {
    return <span key={key}>{(token as Tokens.Text).text}</span>;
  }
  return <span key={key}>{renderBlock(token, v, key, density)}</span>;
}

function renderBlock(
  token: Token,
  v: Variant,
  key: string,
  density: "body" | "headline" = "body",
): ReactNode {
  const c = palette(v);
  const sans = "var(--font-dm-sans), system-ui, sans-serif";
  const mono = "var(--font-dm-mono), ui-monospace, monospace";
  const headlinePara =
    density === "headline" && v === "aboutEya";

  switch (token.type) {
    case "space":
      return null;
    case "paragraph":
      return (
        <p
          key={key}
          style={{
            margin: headlinePara ? "0 0 14px" : "0 0 12px",
            fontFamily: sans,
            fontSize: headlinePara ? 20 : 13,
            fontWeight: headlinePara ? 700 : 300,
            lineHeight: headlinePara ? 1.15 : 1.7,
            color: headlinePara ? c.accent : c.text,
          }}
        >
          {renderInline((token as Tokens.Paragraph).tokens, v, key)}
        </p>
      );
    case "heading": {
      const h = token as Tokens.Heading;
      const sizes: Record<number, number> = { 1: 20, 2: 17, 3: 15, 4: 14, 5: 13, 6: 12 };
      const fs = headlinePara ? 20 : sizes[h.depth] ?? 14;
      return (
        <div
          key={key}
          style={{
            fontFamily: sans,
            fontSize: fs,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            margin: headlinePara ? "0 0 14px" : "16px 0 8px",
            color: headlinePara ? c.accent : h.depth <= 2 ? c.accent : c.text,
          }}
        >
          {renderInline(h.tokens, v, key)}
        </div>
      );
    }
    case "list": {
      const L = token as Tokens.List;
      const Tag = L.ordered ? "ol" : "ul";
      return (
        <Tag
          key={key}
          style={{
            margin: "0 0 12px",
            paddingLeft: 22,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 300,
            lineHeight: 1.7,
            color: c.text,
          }}
        >
          {L.items.map((item, i) =>
            renderListItem(item, v, `${key}-li${i}`, density),
          )}
        </Tag>
      );
    }
    case "code": {
      const co = token as Tokens.Code;
      return (
        <pre
          key={key}
          style={{
            margin: "0 0 12px",
            padding: 12,
            borderRadius: 8,
            background: c.codeBg,
            border: `1px solid ${c.border}`,
            overflow: "auto",
            fontFamily: mono,
            fontSize: 11,
            lineHeight: 1.5,
            color: c.text,
          }}
        >
          <code>{co.text}</code>
        </pre>
      );
    }
    case "blockquote": {
      const q = token as Tokens.Blockquote;
      return (
        <blockquote
          key={key}
          style={{
            margin: "0 0 12px",
            paddingLeft: 14,
            borderLeft: `3px solid ${c.accent}`,
            color: c.muted,
            fontFamily: sans,
            fontSize: 13,
            lineHeight: 1.65,
          }}
        >
          {q.tokens.map((t, i) =>
            renderBlock(t, v, `${key}-q${i}`, density),
          )}
        </blockquote>
      );
    }
    case "hr":
      return (
        <hr
          key={key}
          style={{
            border: "none",
            borderTop: `1px solid ${c.border}`,
            margin: "14px 0",
          }}
        />
      );
    case "table": {
      const tb = token as Tokens.Table;
      return (
        <table
          key={key}
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: 12,
            fontFamily: sans,
            fontSize: 12,
            color: c.text,
          }}
        >
          <thead>
            <tr>
              {tb.header.map((cell, i) => (
                <th
                  key={`h-${i}`}
                  style={{
                    border: `1px solid ${c.border}`,
                    padding: 6,
                    textAlign: (cell.align ?? "left") as "left" | "center" | "right",
                    fontWeight: 700,
                  }}
                >
                  {renderInline(cell.tokens, v, `${key}-th${i}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tb.rows.map((row, ri) => (
              <tr key={`r-${ri}`}>
                {row.map((cell, ci) => (
                  <td
                    key={`c-${ci}`}
                    style={{
                      border: `1px solid ${c.border}`,
                      padding: 6,
                      textAlign: (cell.align ?? "left") as "left" | "center" | "right",
                    }}
                  >
                    {renderInline(cell.tokens, v, `${key}-td${ri}-${ci}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    case "html":
    case "def":
      return null;
    default:
      return null;
  }
}

export interface DocMarkdownWebProps {
  source: string;
  variant: Variant;
  /** Large accent line for About eyay headline (markdown still applies). */
  density?: "body" | "headline";
}

export default function DocMarkdownWeb({
  source,
  variant,
  density = "body",
}: DocMarkdownWebProps) {
  const tokens = lexDocMarkdown(source);
  return (
    <div
      className="doc-md-root"
      style={{
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        overflowWrap: "break-word",
      }}
    >
      {tokens.map((t, i) =>
        renderBlock(t, variant, `b${i}`, density),
      )}
    </div>
  );
}

"use client";

import type { ReactElement, ReactNode } from "react";
import { Link as PdfLink, Text, View } from "@react-pdf/renderer";
import type { Token } from "marked";
import type { Tokens } from "marked";

export interface DocMarkdownPdfCtx {
  pt: (px: number) => number;
  fontSans: string;
  fontMono: string;
  bodyFontSize: number;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  linkColor: string;
  borderColor: string;
  codeBg: string;
  /** About-eya headline: bold accent line */
  lead?: boolean;
}

function flattenInline(
  tokens: Token[] | undefined,
  style: any,
  ctx: DocMarkdownPdfCtx,
): ReactNode[] {
  if (!tokens?.length) return [];
  const out: React.ReactNode[] = [];
  let k = 0;
  const key = () => `t${k++}`;

  for (const t of tokens) {
    switch (t.type) {
      case "text":
        out.push(
          <Text key={key()} style={style}>
            {(t as Tokens.Text).text}
          </Text>,
        );
        break;
      case "strong":
        out.push(
          <Text
            key={key()}
            style={{ ...style, fontWeight: 700 }}
          >
            {flattenInline(
              (t as Tokens.Strong).tokens,
              { ...style, fontWeight: 700 },
              ctx,
            )}
          </Text>,
        );
        break;
      case "em":
        out.push(
          <Text key={key()} style={{ ...style, fontStyle: "italic" }}>
            {flattenInline(
              (t as Tokens.Em).tokens,
              { ...style, fontStyle: "italic" },
              ctx,
            )}
          </Text>,
        );
        break;
      case "del":
        out.push(
          <Text
            key={key()}
            style={{ ...style, textDecoration: "line-through" }}
          >
            {flattenInline(
              (t as Tokens.Del).tokens,
              { ...style, textDecoration: "line-through" },
              ctx,
            )}
          </Text>,
        );
        break;
      case "codespan":
        out.push(
          <Text
            key={key()}
            style={{
              ...style,
              fontFamily: ctx.fontMono,
              fontSize: ctx.bodyFontSize * 0.92,
              backgroundColor: ctx.codeBg,
              padding: ctx.pt(2),
            }}
          >
            {(t as Tokens.Codespan).text}
          </Text>,
        );
        break;
      case "link": {
        const L = t as Tokens.Link;
        out.push(
          <PdfLink
            key={key()}
            src={L.href}
            style={{ color: ctx.linkColor, textDecoration: "underline" }}
          >
            <Text style={style}>
              {flattenInline(L.tokens, style, ctx)}
            </Text>
          </PdfLink>,
        );
        break;
      }
      case "image": {
        const Im = t as Tokens.Image;
        out.push(
          <Text key={key()} style={{ ...style, color: ctx.mutedColor }}>
            [{Im.text || "image"}]
          </Text>,
        );
        break;
      }
      case "br":
        out.push(
          <Text key={key()} style={style}>
            {"\n"}
          </Text>,
        );
        break;
      case "escape":
        out.push(
          <Text key={key()} style={style}>
            {(t as Tokens.Escape).text}
          </Text>,
        );
        break;
      default:
        break;
    }
  }
  return out;
}

const paragraphStyle = (ctx: DocMarkdownPdfCtx): any => ({
  fontFamily: ctx.fontSans,
  fontSize: ctx.bodyFontSize,
  fontWeight: ctx.lead ? 700 : 300,
  lineHeight: ctx.lead ? 1.15 : 1.7,
  color: ctx.textColor,
});

function renderListItemPdf(
  item: Tokens.ListItem,
  ctx: DocMarkdownPdfCtx,
  base: any,
  key: string,
  bullet: string,
): ReactElement {
  return (
    <View
      key={key}
      style={{
        flexDirection: "row",
        marginBottom: ctx.pt(6),
        paddingLeft: ctx.pt(4),
      }}
    >
      <Text style={{ ...base, width: ctx.pt(14) }}>{bullet}</Text>
      <View style={{ flex: 1, flexDirection: "column" }}>
        {item.tokens.map((child, i) =>
          renderListChildPdf(child, ctx, base, `${key}-c${i}`),
        )}
      </View>
    </View>
  );
}

function renderListChildPdf(
  token: Token,
  ctx: DocMarkdownPdfCtx,
  base: any,
  key: string,
): ReactNode {
  if (token.type === "paragraph") {
    const p = token as Tokens.Paragraph;
    return (
      <Text key={key} style={base}>
        {flattenInline(p.tokens, base, ctx)}
      </Text>
    );
  }
  if (token.type === "list") {
    return (
      <View key={key} style={{ marginTop: ctx.pt(6) }}>
        {renderBlockPdf(token, ctx, key)}
      </View>
    );
  }
  if (token.type === "text") {
    return (
      <Text key={key} style={base}>
        {(token as Tokens.Text).text}
      </Text>
    );
  }
  return <View key={key}>{renderBlockPdf(token, ctx, key)}</View>;
}

function renderBlockPdf(
  token: Token,
  ctx: DocMarkdownPdfCtx,
  key: string,
): ReactNode {
  const b = paragraphStyle(ctx);

  switch (token.type) {
    case "space":
      return null;
    case "paragraph":
      return (
        <View key={key} style={{ marginBottom: ctx.pt(10) }}>
          <Text style={b}>
            {flattenInline((token as Tokens.Paragraph).tokens, b, ctx)}
          </Text>
        </View>
      );
    case "heading": {
      const h = token as Tokens.Heading;
      const sizes: Record<number, number> = {
        1: ctx.bodyFontSize + 7,
        2: ctx.bodyFontSize + 4,
        3: ctx.bodyFontSize + 2,
        4: ctx.bodyFontSize + 1,
        5: ctx.bodyFontSize,
        6: ctx.bodyFontSize,
      };
      const fs = sizes[h.depth] ?? ctx.bodyFontSize + 2;
      const headColor = h.depth <= 2 ? ctx.accentColor : ctx.textColor;
      const hb = {
        ...b,
        fontSize: fs,
        fontWeight: 700,
        color: headColor,
        marginBottom: ctx.pt(6),
      };
      return (
        <View key={key} style={{ marginTop: ctx.pt(12), marginBottom: ctx.pt(6) }}>
          <Text style={hb}>
            {flattenInline(h.tokens, hb, ctx)}
          </Text>
        </View>
      );
    }
    case "list": {
      const L = token as Tokens.List;
      return (
        <View key={key} style={{ marginBottom: ctx.pt(10) }}>
          {L.items.map((item, i) => {
            const start =
              typeof L.start === "number" && !Number.isNaN(L.start)
                ? L.start
                : 1;
            const bullet = L.ordered ? `${start + i}.` : "•";
            return renderListItemPdf(item, ctx, b, `${key}-li${i}`, bullet);
          })}
        </View>
      );
    }
    case "code": {
      const co = token as Tokens.Code;
      return (
        <View
          key={key}
          style={{
            marginBottom: ctx.pt(10),
            padding: ctx.pt(10),
            backgroundColor: ctx.codeBg,
            borderWidth: 1,
            borderColor: ctx.borderColor,
            borderStyle: "solid",
          }}
        >
          <Text
            style={{
              fontFamily: ctx.fontMono,
              fontSize: ctx.bodyFontSize * 0.88,
              lineHeight: 1.5,
              color: ctx.textColor,
            }}
          >
            {co.text}
          </Text>
        </View>
      );
    }
    case "blockquote": {
      const q = token as Tokens.Blockquote;
      const qb = { ...b, color: ctx.mutedColor };
      return (
        <View
          key={key}
          style={{
            marginBottom: ctx.pt(10),
            paddingLeft: ctx.pt(12),
            borderLeftWidth: 3,
            borderLeftColor: ctx.accentColor,
            borderLeftStyle: "solid",
          }}
        >
          {q.tokens.map((t, i) => {
            if (t.type === "paragraph") {
              return (
                <View
                  key={`${key}-q${i}`}
                  style={{ marginBottom: ctx.pt(8) }}
                >
                  <Text style={qb}>
                    {flattenInline((t as Tokens.Paragraph).tokens, qb, ctx)}
                  </Text>
                </View>
              );
            }
            return renderBlockPdf(t, ctx, `${key}-q${i}`);
          })}
        </View>
      );
    }
    case "hr":
      return (
        <View
          key={key}
          style={{
            borderBottomWidth: 1,
            borderBottomColor: ctx.borderColor,
            borderBottomStyle: "solid",
            marginTop: ctx.pt(12),
            marginBottom: ctx.pt(12),
          }}
        />
      );
    case "table": {
      const tb = token as Tokens.Table;
      const cellPad = ctx.pt(6);
      return (
        <View key={key} style={{ marginBottom: ctx.pt(10) }}>
          {tb.header.length ? (
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: ctx.borderColor,
                borderBottomStyle: "solid",
              }}
            >
              {tb.header.map((cell, i) => (
                <View
                  key={`h${i}`}
                  style={{
                    flex: 1,
                    padding: cellPad,
                    borderRightWidth: i < tb.header.length - 1 ? 1 : 0,
                    borderRightColor: ctx.borderColor,
                    borderRightStyle: "solid",
                  }}
                >
                  <Text style={{ ...b, fontWeight: 700 }}>
                    {flattenInline(cell.tokens, { ...b, fontWeight: 700 }, ctx)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {tb.rows.map((row, ri) => (
            <View
              key={`r${ri}`}
              style={{
                flexDirection: "row",
                borderBottomWidth: ri < tb.rows.length - 1 ? 1 : 0,
                borderBottomColor: ctx.borderColor,
                borderBottomStyle: "solid",
              }}
            >
              {row.map((cell, ci) => (
                <View
                  key={`c${ci}`}
                  style={{
                    flex: 1,
                    padding: cellPad,
                    borderRightWidth: ci < row.length - 1 ? 1 : 0,
                    borderRightColor: ctx.borderColor,
                    borderRightStyle: "solid",
                  }}
                >
                  <Text style={b}>
                    {flattenInline(cell.tokens, b, ctx)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }
    case "html":
    case "def":
      return null;
    default:
      return null;
  }
}

export function renderDocMarkdownPdf(
  tokens: Token[],
  ctx: DocMarkdownPdfCtx,
): ReactElement[] {
  return tokens
    .map((t, i) => renderBlockPdf(t, ctx, `md${i}`))
    .filter(Boolean) as ReactElement[];
}

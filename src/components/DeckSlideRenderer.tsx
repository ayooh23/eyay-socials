"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  chatBubbleShouldWrap,
  getChatBubbleList,
} from "@/lib/chatSlide";
import { slidesSlideToCarouselSlide } from "@/lib/slidesDeckBridge";
import type { GlobalStyle, SlidesSlide, ThemeKey } from "@/lib/types";
import { THEMES } from "@/lib/themes";

const DECK_REF_W = 1080;

export interface DeckSlideRendererProps {
  slide: SlidesSlide;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
}

function linesToBr(text: string) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </span>
  ));
}

/** Parse **bold**, *italic*, `code` and newlines into React nodes. */
function parseMd(text: string, accentColor?: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const lines = text.split("\n");
  lines.forEach((line, li) => {
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      if (m.index > last) nodes.push(line.slice(last, m.index));
      if (m[2] != null) {
        nodes.push(<strong key={`${li}-b-${m.index}`}>{m[2]}</strong>);
      } else if (m[3] != null) {
        nodes.push(<em key={`${li}-i-${m.index}`}>{m[3]}</em>);
      } else if (m[4] != null) {
        nodes.push(
          <span
            key={`${li}-c-${m.index}`}
            style={{
              background: accentColor ? `${accentColor}22` : "rgba(255,255,255,.1)",
              borderRadius: 4,
              padding: "1px 5px",
            }}
          >
            {m[4]}
          </span>,
        );
      }
      last = m.index + m[0].length;
    }
    if (last < line.length) nodes.push(line.slice(last));
    if (li < lines.length - 1) nodes.push(<br key={`br-${li}`} />);
  });
  return nodes;
}

export default function DeckSlideRenderer({
  slide,
  globalStyle,
  slideIndex,
  totalSlides,
}: DeckSlideRendererProps) {
  const paletteKey = (slide.theme ?? "dark") as ThemeKey;
  const t = THEMES[paletteKey] ?? THEMES.dark;
  const align = slide.align ?? "left";
  const { size: fs, showTag, showNum } = globalStyle;
  const k = 1920 / DECK_REF_W;
  const hlSize = Math.min(Math.round(fs * k), 200);
  const subHl = Math.min(Math.round(hlSize * 0.72), 140);
  const bodySize = Math.round(19 * k);
  const listSize = Math.round(21 * k);
  const bodyCopyStyle: CSSProperties = { whiteSpace: "pre-line" };
  const statNum = Math.round(100 * k);
  const ac = align === "center";
  const ar = align === "right";
  const acs: CSSProperties = { textAlign: align };
  const autoM: CSSProperties =
    ac
      ? { marginLeft: "auto", marginRight: "auto" }
      : ar
        ? { marginLeft: "auto" }
        : {};

  const barMargin: CSSProperties = ac
    ? { margin: "0 auto 28px" }
    : ar
      ? { marginLeft: "auto", marginRight: 0, marginBottom: 28 }
      : { marginBottom: 28 };

  let body: ReactNode = null;

  if (slide.layout === "title") {
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar sd-deck-bar"
          style={{ background: t.accent, ...barMargin }}
        />
        {slide.headline ? (
          <div
            className="s-hl sd-deck-hl-title"
            style={{ color: t.text, fontSize: hlSize }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        {slide.body?.trim() ? (
          <div
            className="s-bt sd-deck-bt"
            style={{
              color: t.muted,
              fontSize: bodySize,
              marginTop: 18,
              ...autoM,
              ...bodyCopyStyle,
            }}
          >
            {parseMd(slide.body)}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "content") {
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar sd-deck-bar"
          style={{ background: t.accent, ...barMargin }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{ color: t.text, fontSize: subHl, marginBottom: 24 }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        {slide.body ? (
          <div
            className="s-bt sd-deck-bt"
            style={{
              color: t.muted,
              fontSize: bodySize,
              ...autoM,
              ...bodyCopyStyle,
            }}
          >
            {parseMd(slide.body)}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "bullets") {
    const its = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar sd-deck-bar"
          style={{ background: t.accent, ...barMargin }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: Math.min(subHl, 120),
              marginBottom: 22,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        <div
          className="s-list sd-deck-list"
          style={ac ? { alignItems: "center" } : undefined}
        >
          {its.map((it, i) => (
            <div
              key={i}
              className="s-li sd-deck-li"
              style={{ color: t.text, fontSize: listSize }}
            >
              <div className="s-ldot sd-deck-ldot" style={{ background: t.accent }} />
              {it}
            </div>
          ))}
        </div>
        {slide.body?.trim() ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: Math.min(subHl, 110),
              marginTop: 32,
              lineHeight: 1.1,
            }}
          >
            {parseMd(slide.body)}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "quote") {
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.headline ? (
          <div
            className="s-hl sd-deck-quote"
            style={{
              color: t.text,
              fontSize: Math.min(hlSize, 168),
              fontStyle: "italic",
              fontWeight: 400,
              lineHeight: 1.15,
              marginBottom: 28,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        {slide.body ? (
          <div
            className="sd-deck-attrib"
            style={{
              color: t.muted,
              fontSize: bodySize,
              ...autoM,
              ...bodyCopyStyle,
            }}
          >
            {slide.body}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "stat") {
    const sts = [
      slide.s1n ? { n: slide.s1n, l: slide.s1l } : null,
      slide.s2n ? { n: slide.s2n, l: slide.s2l } : null,
    ].filter(Boolean) as { n: string; l: string }[];

    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar sd-deck-bar"
          style={{ background: t.accent, ...barMargin }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: Math.min(subHl, 110),
              marginBottom: 28,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        <div
          className="s-stats sd-deck-stats"
          style={ac ? { justifyContent: "center" } : undefined}
        >
          {sts.map((st, i) => (
            <div key={i} className="s-stat">
              <div className="s-sn" style={{ color: t.accent, fontSize: statNum }}>
                {st.n}
              </div>
              <div className="s-sl sd-deck-sl" style={{ color: t.muted }}>
                {st.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "split") {
    const hasPhoto = Boolean(slide.splitImageDataUrl?.trim());
    body = (
      <div
        className="s-body sd-deck-body sd-deck-split-wrap"
        style={{ ...acs, justifyContent: "center" }}
      >
        <div className="sd-deck-split">
          <div
            className={`sd-deck-split-img ${hasPhoto ? "sd-deck-split-img--fill" : ""}`}
            style={{
              borderColor: hasPhoto ? "transparent" : t.muted,
              color: t.muted,
              background: hasPhoto ? "transparent" : `${t.text}08`,
            }}
          >
            {hasPhoto ? (
              <img
                src={slide.splitImageDataUrl}
                alt=""
                className="sd-deck-split-photo"
              />
            ) : (
              <span className="sd-deck-split-hint">
                {slide.imageHint || "Image"}
              </span>
            )}
          </div>
          <div
            className="sd-deck-split-text"
            style={{ textAlign: align === "center" ? "center" : align }}
          >
            {slide.eyebrow ? (
              <div
                className="s-eyebrow sd-deck-eyebrow"
                style={{ color: t.muted, marginBottom: 16 }}
              >
                {slide.eyebrow}
              </div>
            ) : null}
            {slide.headline ? (
              <div
                className="s-hl"
                style={{ color: t.text, fontSize: subHl, marginBottom: 18 }}
              >
                {linesToBr(slide.headline)}
              </div>
            ) : null}
            {slide.body ? (
              <div
                className="s-bt sd-deck-bt"
                style={{ color: t.muted, fontSize: bodySize, ...bodyCopyStyle }}
              >
                {parseMd(slide.body)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  } else if (slide.layout === "cases") {
    const hasPhoto = Boolean(slide.splitImageDataUrl?.trim());
    const chatSlide = slidesSlideToCarouselSlide(slide);
    const caseBubbles = getChatBubbleList(chatSlide);
    const caseTermLine = slide.term || "";
    const caseBubFs = Math.round(14 * k);
    const caseTermFs = Math.round(13 * k);
    body = (
      <div
        className="s-body sd-deck-body"
        style={{ textAlign: "left", justifyContent: "flex-start" }}
      >
        {/* title row: project name + client */}
        <div style={{ display: "flex", alignItems: "baseline", gap: Math.round(14 * k), marginBottom: Math.round(4 * k) }}>
          <div style={{ fontWeight: 600, fontSize: Math.round(28 * k), color: t.text, lineHeight: 1.1 }}>
            {slide.headline ? linesToBr(slide.headline) : null}
          </div>
          {slide.caseClient ? (
            <div style={{ fontWeight: 300, fontSize: Math.round(14 * k), color: t.muted }}>
              {slide.caseClient}
            </div>
          ) : null}
        </div>
        {/* type tag row */}
        {slide.eyebrow || slide.caseClient ? (
          <div style={{ display: "flex", alignItems: "center", gap: Math.round(10 * k), marginBottom: Math.round(14 * k) }}>
            {slide.eyebrow ? (
              <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(10 * k), color: t.accent, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                {slide.eyebrow}
              </div>
            ) : null}
          </div>
        ) : null}
        {/* two-column body */}
        <div style={{ display: "flex", gap: Math.round(32 * k), flex: 1, minHeight: 0 }}>
          {/* LEFT column: image + description + result */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "16 / 9",
                borderRadius: Math.round(10 * k),
                overflow: "hidden",
                border: hasPhoto ? "none" : `2px solid ${t.muted}`,
                background: hasPhoto ? "transparent" : `${t.text}06`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                flexShrink: 0,
              }}
            >
              {hasPhoto ? (
                <img
                  src={slide.splitImageDataUrl}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}
                />
              ) : (
                <span style={{ fontFamily: "var(--mono)", fontSize: Math.round(11 * k), color: t.muted, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.5 }}>
                  {slide.imageHint || "Visual"}
                </span>
              )}
            </div>
            {slide.body ? (
              <div style={{ fontWeight: 300, fontSize: Math.round(14 * k), color: t.muted, lineHeight: 1.5, whiteSpace: "pre-line", marginTop: Math.round(12 * k) }}>
                {slide.body}
              </div>
            ) : null}
            {slide.caseResult ? (
              <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(12 * k), color: t.text, borderTop: `1px solid ${t.muted}`, paddingTop: Math.round(8 * k), marginTop: "auto", opacity: 0.88 }}>
                {slide.caseResult}
              </div>
            ) : null}
          </div>
          {/* RIGHT column: chat + terminal */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", minWidth: 0 }}>
            {caseBubbles.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: Math.round(8 * k) }}>
                {caseBubbles.map((b) => (
                  <div
                    key={b.key}
                    style={{ alignSelf: b.d === "out" ? "flex-end" : "flex-start", maxWidth: "85%" }}
                  >
                    <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(8 * k), color: t.muted, marginBottom: 2, opacity: 0.7 }}>
                      {b.nm}
                    </div>
                    <div
                      style={{
                        background: b.d === "in" ? t.bIn : t.bOut,
                        color: b.d === "in" ? t.bInT : t.bOutT,
                        fontSize: caseBubFs,
                        padding: `${Math.round(8 * k)}px ${Math.round(12 * k)}px`,
                        borderRadius: Math.round(14 * k),
                        lineHeight: 1.35,
                        whiteSpace: "pre-line",
                      }}
                    >
                      {b.txt}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {caseTermLine ? (
              <div
                style={{
                  background: t.term,
                  color: t.termT,
                  fontSize: caseTermFs,
                  padding: `${Math.round(10 * k)}px ${Math.round(14 * k)}px`,
                  borderRadius: Math.round(8 * k),
                  fontFamily: "var(--mono)",
                  lineHeight: 1.6,
                  marginTop: Math.round(12 * k),
                }}
              >
                <span style={{ color: t.accent }}>{`> ${slide.termPrompt || "eyay"}: `}</span>
                {parseMd(caseTermLine, t.accent)}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  } else if (slide.layout === "terminal") {
    const termLine = slide.term || "where ideas get built today";
    body = (
      <div className="s-body sd-deck-body">
        {slide.eyebrow ? (
          <div
            className="s-eyebrow sd-deck-eyebrow"
            style={{ color: t.muted, marginBottom: 14 }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-term sd-deck-term"
          style={{
            background: t.term,
            color: t.termT,
            fontSize: Math.round(26 * k),
            padding: `${Math.round(19 * k)}px ${Math.round(22 * k)}px`,
            borderRadius: Math.round(16 * k * 0.55),
          }}
        >
          <span
            className="s-tpr"
            style={{ color: t.accent, marginRight: Math.round(10 * k * 0.45) }}
          >
            {`➜  ${slide.termPrompt || "eyay"}:`}
          </span>
          {parseMd(termLine, t.accent)}
          <span
            className="s-tcur"
            style={{
              background: t.accent,
              width: Math.round(14 * k * 0.55),
              height: Math.round(22 * k * 0.55),
            }}
          />
        </div>
      </div>
    );
  } else if (slide.layout === "chat") {
    const chatSlide = slidesSlideToCarouselSlide(slide);
    const chatBubbles = getChatBubbleList(chatSlide);
    const chatGap = Math.round(18 * k * 0.72);
    body = (
      <div
        className="s-body sd-deck-body sd-deck-chat-body"
        style={{
          textAlign: "left",
          justifyContent: "flex-end",
          paddingBottom: 0,
        }}
      >
        {slide.eyebrow ? (
          <div
            className="s-eyebrow sd-deck-eyebrow"
            style={{ color: t.muted, marginBottom: 14 }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div className="s-chat sd-deck-chat" style={{ gap: chatGap }}>
          {chatBubbles.map((b) => {
            const wrap = chatBubbleShouldWrap(b.txt);
            return (
              <div
                key={b.key}
                className={`s-brow ${b.d === "out" ? "out" : ""}`}
              >
                <div className="s-bwrap">
                  <div
                    className="s-bname"
                    style={{
                      color: t.muted,
                      fontSize: Math.round(16 * k * 0.82),
                    }}
                  >
                    {b.nm}
                  </div>
                  <div
                    className={`s-bubble ${b.d}${wrap ? " s-bubble-wrap" : ""}`}
                    style={{
                      background: b.d === "in" ? t.bIn : t.bOut,
                      color: b.d === "in" ? t.bInT : t.bOutT,
                      fontSize: Math.round(28 * k * 0.82),
                      padding: `${Math.round(18 * k * 0.55)}px ${Math.round(24 * k * 0.55)}px`,
                      borderRadius: Math.round(34 * k * 0.55),
                    }}
                  >
                    {wrap ? linesToBr(b.txt) : b.txt}
                  </div>
                  <div
                    className="s-bmeta"
                    style={{
                      color: t.muted,
                      fontSize: Math.round(18 * k * 0.72),
                    }}
                  >
                    {b.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (slide.layout === "financial") {
    const rows = slide.financialRows ?? [];
    const tf = Math.round(13 * k * 0.88);
    const th = Math.round(10 * k * 0.78);
    const monoFoot = Math.round(10 * k * 0.72);
    const borderCol = t.muted;
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar sd-deck-bar"
          style={{ background: t.accent, ...barMargin }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: Math.min(subHl, 112),
              marginBottom: 20,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        <div className="sd-deck-fin-scroll">
          <table
            className="sd-deck-fin-table"
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: tf,
            }}
          >
            <thead>
              <tr
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: th,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: t.muted,
                  borderBottom: `1px solid ${borderCol}`,
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "0 0 10px",
                    fontWeight: 400,
                  }}
                >
                  Label
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "0 0 10px",
                    fontWeight: 400,
                  }}
                >
                  Description
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "0 0 10px",
                    fontWeight: 400,
                  }}
                >
                  Qty
                </th>
                <th
                  style={{
                    textAlign: "right",
                    padding: "0 0 10px",
                    fontWeight: 400,
                  }}
                >
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  style={{
                    borderBottom: `1px solid ${borderCol}`,
                    fontFamily: "var(--sans)",
                    fontWeight: 300,
                    verticalAlign: "top",
                  }}
                >
                  <td style={{ padding: "12px 8px 12px 0", width: "22%" }}>
                    {r.label}
                  </td>
                  <td style={{ padding: "12px 8px", color: t.muted }}>
                    {r.description}
                  </td>
                  <td
                    style={{
                      padding: "12px 8px",
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontSize: Math.round(11 * k * 0.75),
                    }}
                  >
                    {r.qty}
                  </td>
                  <td
                    style={{
                      padding: "12px 0 12px 8px",
                      textAlign: "right",
                      fontFamily: "var(--mono)",
                      fontSize: Math.round(12 * k * 0.78),
                    }}
                  >
                    {r.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {slide.financialVatNote?.trim() ? (
          <div
            style={{
              marginTop: Math.round(12 * k * 0.55),
              fontFamily: "var(--mono)",
              fontSize: monoFoot,
              color: t.muted,
              letterSpacing: "0.04em",
            }}
          >
            {slide.financialVatNote}
          </div>
        ) : null}
        {slide.financialPaymentTerms?.trim() ? (
          <div
            style={{
              marginTop: Math.round(8 * k * 0.55),
              fontFamily: "var(--mono)",
              fontSize: monoFoot,
              color: t.muted,
            }}
          >
            Payment terms: {slide.financialPaymentTerms}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "team") {
    const p1Items = [slide.l1, slide.l2].filter(Boolean);
    const p2Items = [slide.l3, slide.l4].filter(Boolean);
    body = (
      <div className="s-body sd-deck-body" style={{ textAlign: "left" }}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>{slide.eyebrow}</div>
        ) : null}
        <div className="s-bar sd-deck-bar" style={{ background: t.accent, marginBottom: 28 }} />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: subHl, marginBottom: 28 }}>{linesToBr(slide.headline)}</div>
        ) : null}
        <div style={{ display: "flex", gap: Math.round(40 * k), flex: 1, minHeight: 0 }}>
          {[{ name: slide.sn1 || "Person 1", role: slide.s1l, items: p1Items }, { name: slide.sn2 || "Person 2", role: slide.s2l, items: p2Items }].map((p, ci) => (
            <div key={ci} style={{ flex: 1, border: `1px solid ${t.muted}`, borderRadius: Math.round(12 * k), padding: `${Math.round(24 * k)}px ${Math.round(28 * k)}px` }}>
              <div style={{ fontWeight: 600, fontSize: Math.round(22 * k), color: t.text, marginBottom: 4 }}>{p.name}</div>
              {p.role ? <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(10 * k), color: t.accent, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: Math.round(16 * k) }}>{p.role}</div> : null}
              {p.items.map((it, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: t.accent, marginTop: 8, flexShrink: 0, opacity: 0.55 }} />
                  <span style={{ color: t.text, fontSize: Math.round(14 * k), lineHeight: 1.5, fontWeight: 300 }}>{it}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        {slide.body?.trim() ? (
          <div style={{ color: t.muted, fontSize: Math.round(16 * k), fontWeight: 400, fontStyle: "italic", marginTop: Math.round(24 * k), textAlign: "center" }}>{parseMd(slide.body)}</div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "pillars") {
    const pillars = [
      { title: slide.p1title, body: slide.p1body },
      { title: slide.p2title, body: slide.p2body },
      { title: slide.p3title, body: slide.p3body },
    ].filter((p) => p.title || p.body);
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>{slide.eyebrow}</div>
        ) : null}
        <div className="s-bar sd-deck-bar" style={{ background: t.accent, ...barMargin }} />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: subHl, marginBottom: 28 }}>{linesToBr(slide.headline)}</div>
        ) : null}
        <div style={{ display: "flex", gap: Math.round(36 * k), flex: 1, minHeight: 0 }}>
          {pillars.map((p, i) => (
            <div key={i} style={{ flex: 1, minWidth: 0 }}>
              {p.title ? <div style={{ fontWeight: 600, fontSize: Math.round(20 * k), color: t.text, marginBottom: 10, lineHeight: 1.2 }}>{p.title}</div> : null}
              {p.body ? <div style={{ fontWeight: 300, fontSize: Math.round(14 * k), color: t.muted, lineHeight: 1.55, whiteSpace: "pre-line" }}>{parseMd(p.body)}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "grid") {
    const items = slide.gridItems ?? [];
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>{slide.eyebrow}</div>
        ) : null}
        <div className="s-bar sd-deck-bar" style={{ background: t.accent, ...barMargin }} />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: subHl, marginBottom: 24 }}>{linesToBr(slide.headline)}</div>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: Math.round(20 * k) }}>
          {items.map((it) => (
            <div
              key={it.id}
              style={{
                flex: `0 0 calc(${items.length <= 3 ? "33.333%" : "50%"} - ${Math.round(14 * k)}px)`,
                border: `1px solid ${t.muted}`,
                borderRadius: Math.round(10 * k),
                padding: `${Math.round(18 * k)}px ${Math.round(22 * k)}px`,
              }}
            >
              <div style={{ fontWeight: 600, fontSize: Math.round(16 * k), color: t.text, marginBottom: 6 }}>{it.title}</div>
              {it.description ? <div style={{ fontWeight: 300, fontSize: Math.round(12 * k), color: t.muted, lineHeight: 1.5 }}>{it.description}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "comparison") {
    const cols = slide.compColumns ?? [];
    const rows = slide.compRows ?? [];
    const hi = slide.compHighlight ?? -1;
    const colW = cols.length ? `${100 / (cols.length + 1)}%` : "25%";
    body = (
      <div className="s-body sd-deck-body" style={{ textAlign: "left" }}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>{slide.eyebrow}</div>
        ) : null}
        <div className="s-bar sd-deck-bar" style={{ background: t.accent, marginBottom: 28 }} />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: subHl, marginBottom: 24 }}>{linesToBr(slide.headline)}</div>
        ) : null}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: Math.round(12 * k) }}>
          <thead>
            <tr style={{ fontFamily: "var(--mono)", fontSize: Math.round(10 * k), letterSpacing: "0.08em", textTransform: "uppercase", color: t.muted, borderBottom: `1px solid ${t.muted}` }}>
              <th style={{ textAlign: "left", padding: "0 0 10px", fontWeight: 400, width: colW }} />
              {cols.map((c, ci) => (
                <th key={ci} style={{ textAlign: "left", padding: "0 0 10px", fontWeight: ci === hi ? 700 : 400, color: ci === hi ? t.accent : t.muted, width: colW }}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${t.muted}`, fontWeight: 300 }}>
                <td style={{ padding: "12px 8px 12px 0", color: t.muted, fontFamily: "var(--mono)", fontSize: Math.round(10 * k), letterSpacing: "0.05em", textTransform: "uppercase" }}>{r.label}</td>
                {cols.map((_, ci) => (
                  <td key={ci} style={{ padding: "12px 8px", color: ci === hi ? t.text : t.muted, fontWeight: ci === hi ? 500 : 300, background: ci === hi ? `${t.accent}0a` : "transparent" }}>{(r.cells ?? [])[ci] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  } else if (slide.layout === "process") {
    const steps = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>{slide.eyebrow}</div>
        ) : null}
        <div className="s-bar sd-deck-bar" style={{ background: t.accent, ...barMargin }} />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: subHl, marginBottom: 32 }}>{linesToBr(slide.headline)}</div>
        ) : null}
        <div style={{ display: "flex", alignItems: "flex-start", gap: Math.round(12 * k) }}>
          {steps.map((st, i) => (
            <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-start", gap: Math.round(12 * k) }}>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div style={{ width: Math.round(40 * k), height: Math.round(40 * k), borderRadius: "50%", background: t.accent, color: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: Math.round(16 * k), margin: "0 auto", marginBottom: Math.round(12 * k) }}>{i + 1}</div>
                <div style={{ fontWeight: 500, fontSize: Math.round(14 * k), color: t.text, lineHeight: 1.35 }}>{st}</div>
              </div>
              {i < steps.length - 1 ? (
                <div style={{ color: t.muted, fontSize: Math.round(20 * k), marginTop: Math.round(10 * k), opacity: 0.4 }}>→</div>
              ) : null}
            </div>
          ))}
        </div>
        {slide.body?.trim() ? (
          <div style={{ color: t.muted, fontSize: Math.round(12 * k), fontWeight: 300, marginTop: Math.round(28 * k), whiteSpace: "pre-line" }}>{parseMd(slide.body)}</div>
        ) : null}
        {slide.financialPaymentTerms?.trim() ? (
          <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(10 * k), color: t.muted, marginTop: Math.round(12 * k), opacity: 0.7 }}>Payment terms: {slide.financialPaymentTerms}</div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "packages") {
    const cards = slide.packageCards ?? [];
    body = (
      <div className="s-body sd-deck-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow sd-deck-eyebrow" style={{ color: t.muted }}>{slide.eyebrow}</div>
        ) : null}
        <div className="s-bar sd-deck-bar" style={{ background: t.accent, ...barMargin }} />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: subHl, marginBottom: 28 }}>{linesToBr(slide.headline)}</div>
        ) : null}
        <div style={{ display: "flex", gap: Math.round(20 * k), flex: 1, minHeight: 0 }}>
          {cards.map((c) => (
            <div
              key={c.id}
              style={{
                flex: 1,
                border: c.recommended ? `2px solid ${t.accent}` : `1px solid ${t.muted}`,
                borderRadius: Math.round(12 * k),
                padding: `${Math.round(24 * k)}px ${Math.round(22 * k)}px`,
                position: "relative",
                background: c.recommended ? `${t.accent}08` : "transparent",
              }}
            >
              {c.recommended ? (
                <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(8 * k), color: t.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Recommended</div>
              ) : null}
              <div style={{ fontWeight: 600, fontSize: Math.round(18 * k), color: t.text, marginBottom: 6 }}>{c.name}</div>
              {c.price ? <div style={{ fontWeight: 700, fontSize: Math.round(24 * k), color: t.accent, marginBottom: 4 }}>{c.price}</div> : null}
              {c.duration ? <div style={{ fontFamily: "var(--mono)", fontSize: Math.round(10 * k), color: t.muted, marginBottom: Math.round(14 * k), letterSpacing: "0.04em" }}>{c.duration}</div> : null}
              {c.items ? <div style={{ fontWeight: 300, fontSize: Math.round(12 * k), color: t.muted, lineHeight: 1.6, whiteSpace: "pre-line" }}>{c.items}</div> : null}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "ending") {
    body = (
      <div
        className="s-body sd-deck-body"
        style={{ textAlign: "left" }}
      >
        {slide.eyebrow ? (
          <div
            className="s-eyebrow sd-deck-eyebrow"
            style={{ color: t.muted }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar sd-deck-bar"
          style={{ background: t.accent, marginBottom: 28 }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: hlSize,
              lineHeight: 1.05,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        {(() => {
          const endItems = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
          return endItems.length > 0 ? (
            <div className="s-list sd-deck-list" style={{ marginTop: 24 }}>
              {endItems.map((it, i) => (
                <div
                  key={i}
                  className="s-li sd-deck-li"
                  style={{ color: t.text, fontSize: listSize }}
                >
                  <div className="s-ldot sd-deck-ldot" style={{ background: t.accent }} />
                  {it}
                </div>
              ))}
            </div>
          ) : null;
        })()}
        {slide.body?.trim() ? (
          <div
            className="s-bt sd-deck-bt"
            style={{
              color: t.muted,
              fontSize: bodySize,
              ...bodyCopyStyle,
              marginTop: 28,
            }}
          >
            {parseMd(slide.body)}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "blank") {
    body = <div className="s-body sd-deck-body" style={acs} />;
  } else {
    body = <div className="s-body sd-deck-body" style={acs} />;
  }

  return (
    <>
      <div className="s-bg" style={{ background: t.bg }} />
      <div className="s-grain" />
      <div className="s-grid s-grid--deck">
        <div className="s-hdr sd-deck-hdr">
          <span
            className="s-tag sd-deck-tag"
            style={{
              color: t.text,
              display: showTag ? "block" : "none",
            }}
          >
            eyay.studio
          </span>
          <span
            className="s-num sd-deck-num"
            style={{
              color: t.text,
              display: showNum ? "block" : "none",
            }}
          >
            {String(slideIndex + 1).padStart(2, "0")} /{" "}
            {String(totalSlides).padStart(2, "0")}
          </span>
        </div>
        {body}
        <div className="s-ftr sd-deck-ftr">
          <span className="s-cta sd-deck-cta" style={{ color: t.muted }}>
            {slide.cta || ""}
          </span>
        </div>
      </div>
    </>
  );
}

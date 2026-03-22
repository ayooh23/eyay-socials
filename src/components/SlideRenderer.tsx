"use client";

import type { CSSProperties, RefObject } from "react";
import type { GlobalStyle, Slide, ThemeKey } from "@/lib/types";
import { THEMES } from "@/lib/themes";

export interface SlideRendererProps {
  slide: Slide;
  /** When set (e.g. transition export), overrides slide.theme for palette only. */
  themeKey?: ThemeKey;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
  /** When true, chat bubbles render fully visible (export / offscreen). */
  staticChat?: boolean;
  chatContainerRef?: RefObject<HTMLDivElement | null>;
}

function linesToBr(text: string) {
  return text.split("\n").map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 ? <br /> : null}
    </span>
  ));
}

export default function SlideRenderer({
  slide,
  themeKey,
  globalStyle,
  slideIndex,
  totalSlides,
  staticChat,
  chatContainerRef,
}: SlideRendererProps) {
  const paletteKey = (themeKey ?? slide.theme ?? "dark") as ThemeKey;
  const t = THEMES[paletteKey] ?? THEMES.dark;
  const align = slide.align ?? "left";
  const { size: fs, showTag, showNum } = globalStyle;
  const ac = align === "center";
  const ar = align === "right";
  const acs: CSSProperties = { textAlign: align };
  const autoM: CSSProperties =
    ac
      ? { marginLeft: "auto", marginRight: "auto" }
      : ar
        ? { marginLeft: "auto" }
        : {};

  const barMarginHeadline: CSSProperties = ac
    ? { margin: "0 auto 32px" }
    : ar
      ? { marginLeft: "auto", marginRight: 0, marginBottom: 32 }
      : { marginBottom: 32 };

  const barMarginStatList: CSSProperties = ac
    ? { margin: "0 auto 32px" }
    : { marginBottom: 32 };

  const chatBubbles = [
    slide.m1
      ? {
          txt: slide.m1,
          d: "in" as const,
          time: "01:23",
        }
      : null,
    slide.m2
      ? {
          txt: slide.m2,
          d: "out" as const,
          time: "06:46",
        }
      : null,
    slide.m3
      ? {
          txt: slide.m3,
          d: "in" as const,
          time: "11:18",
        }
      : null,
  ].filter(Boolean) as {
    txt: string;
    d: "in" | "out";
    time: string;
  }[];

  let body: React.ReactNode = null;

  if (slide.layout === "headline") {
    body = (
      <div className="s-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar"
          style={{ background: t.accent, ...barMarginHeadline }}
        />
        {slide.headline ? (
          <div className="s-hl" style={{ color: t.text, fontSize: fs }}>
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        {slide.body ? (
          <div className="s-bt" style={{ color: t.muted, ...autoM }}>
            {slide.body}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "chat") {
    body = (
      <div
        className="s-body"
        style={{
          textAlign: "left",
          justifyContent: "flex-end",
          paddingBottom: 0,
        }}
      >
        {slide.eyebrow ? (
          <div
            className="s-eyebrow"
            style={{ color: t.muted, marginBottom: 14 }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div ref={chatContainerRef} className="s-chat">
          {chatBubbles.map((b, i) => (
            <div
              key={i}
              className={`s-brow ${b.d === "out" ? "out" : ""}`}
              data-bi={i}
              style={
                staticChat
                  ? {
                      opacity: 1,
                      transform: "translateY(0) scale(1)",
                    }
                  : {
                      opacity: 0,
                      transform: "translateY(18px) scale(0.96)",
                    }
              }
            >
              <div>
                <div
                  className={`s-bubble ${b.d}`}
                  style={{
                    background: b.d === "in" ? t.bIn : t.bOut,
                    color: b.d === "in" ? t.bInT : t.bOutT,
                  }}
                >
                  {b.txt}
                </div>
                <div className="s-bmeta" style={{ color: t.muted }}>
                  {b.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "stat") {
    const sts = [
      slide.s1n ? { n: slide.s1n, l: slide.s1l } : null,
      slide.s2n ? { n: slide.s2n, l: slide.s2l } : null,
    ].filter(Boolean) as { n: string; l: string }[];

    body = (
      <div className="s-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar"
          style={{ background: t.accent, ...barMarginStatList }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: Math.min(fs, 80),
              marginBottom: 36,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        <div
          className="s-stats"
          style={ac ? { justifyContent: "center" } : undefined}
        >
          {sts.map((st, i) => (
            <div key={i} className="s-stat">
              <div className="s-sn" style={{ color: t.accent }}>
                {st.n}
              </div>
              <div className="s-sl" style={{ color: t.muted }}>
                {st.l}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "list") {
    const its = [slide.l1, slide.l2, slide.l3, slide.l4].filter(Boolean);
    body = (
      <div className="s-body" style={acs}>
        {slide.eyebrow ? (
          <div className="s-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar"
          style={{ background: t.accent, ...barMarginStatList }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            style={{
              color: t.text,
              fontSize: Math.min(fs, 72),
              marginBottom: 28,
            }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        <div
          className="s-list"
          style={ac ? { alignItems: "center" } : undefined}
        >
          {its.map((it, i) => (
            <div key={i} className="s-li" style={{ color: t.text }}>
              <div className="s-ldot" style={{ background: t.accent }} />
              {it}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "terminal") {
    body = (
      <div className="s-body">
        {slide.eyebrow ? (
          <div className="s-eyebrow" style={{ color: t.muted }}>
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-term"
          style={{ background: t.term, color: t.termT }}
        >
          <span className="s-tpr" style={{ color: t.accent }}>
            {"➜  eyay:"}
          </span>
          {slide.term || "where ideas get built today"}
          <span className="s-tcur" style={{ background: t.accent }} />
        </div>
      </div>
    );
  }

  const dots = Array.from({ length: totalSlides }, (_, i) => (
    <div
      key={i}
      className={`s-dot ${i === slideIndex ? "on" : ""}`}
      style={{ color: t.text }}
    />
  ));

  return (
    <>
      <div className="s-bg" style={{ background: t.bg }} />
      <div className="s-grain" />
      <div className="s-grid">
        <div className="s-hdr">
          <span
            className="s-tag"
            style={{
              color: t.text,
              display: showTag ? "block" : "none",
            }}
          >
            eyay.studio
          </span>
          <span
            className="s-num"
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
        <div className="s-ftr">
          <span className="s-cta" style={{ color: t.muted }}>
            {slide.cta || ""}
          </span>
          <div className="s-dots">{dots}</div>
        </div>
      </div>
    </>
  );
}

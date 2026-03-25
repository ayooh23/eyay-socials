"use client";

import type { CSSProperties, RefObject } from "react";
import { useMemo, useRef } from "react";
import {
  chatBubbleShouldWrap,
  getChatBubbleList,
} from "@/lib/chatSlide";
import type { GlobalStyle, Slide, ThemeKey } from "@/lib/types";
import { THEMES } from "@/lib/themes";
import {
  STAGGER_BASE_MS,
  STAGGER_STEP_MS,
  useStaggerFadeIn,
} from "@/hooks/useStaggerFadeIn";
import { TypewriterText } from "@/components/TypewriterText";

export interface SlideRendererProps {
  slide: Slide;
  /** When set (e.g. transition export), overrides slide.theme for palette only. */
  themeKey?: ThemeKey;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
  /** When true, chat bubbles render fully visible (export / offscreen). */
  staticChat?: boolean;
  /** When false (e.g. PNG capture), skip enter animations and typewriter. */
  animate?: boolean;
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
  animate = true,
  chatContainerRef,
}: SlideRendererProps) {
  const animRootRef = useRef<HTMLDivElement>(null);
  const runAnim = animate;
  const fs = globalStyle.size;

  const headlineAnimKey = useMemo(
    () =>
      [
        slide.id,
        slide.eyebrow,
        slide.headline,
        slide.body,
        fs,
      ].join("\u0001"),
    [slide.id, slide.eyebrow, slide.headline, slide.body, fs],
  );

  const statAnimKey = useMemo(
    () =>
      [
        slide.id,
        slide.eyebrow,
        slide.headline,
        slide.s1n,
        slide.s1l,
        slide.s2n,
        slide.s2l,
        fs,
      ].join("\u0001"),
    [
      slide.id,
      slide.eyebrow,
      slide.headline,
      slide.s1n,
      slide.s1l,
      slide.s2n,
      slide.s2l,
      fs,
    ],
  );

  const listAnimKey = useMemo(
    () =>
      [slide.id, slide.eyebrow, slide.headline, slide.l1, slide.l2, slide.l3, slide.l4, fs].join(
        "\u0001",
      ),
    [slide.id, slide.eyebrow, slide.headline, slide.l1, slide.l2, slide.l3, slide.l4, fs],
  );

  const terminalAnimKey = useMemo(
    () => [slide.id, slide.eyebrow, slide.term].join("\u0001"),
    [slide.id, slide.eyebrow, slide.term],
  );

  const chatEyebrowAnimKey = useMemo(
    () => [slide.id, slide.eyebrow].join("\u0001"),
    [slide.id, slide.eyebrow],
  );

  useStaggerFadeIn(runAnim && slide.layout === "headline", animRootRef, [headlineAnimKey]);

  useStaggerFadeIn(runAnim && slide.layout === "stat", animRootRef, [statAnimKey]);

  useStaggerFadeIn(runAnim && slide.layout === "list", animRootRef, [listAnimKey]);

  useStaggerFadeIn(runAnim && slide.layout === "terminal", animRootRef, [terminalAnimKey]);

  useStaggerFadeIn(
    runAnim && slide.layout === "chat" && !!slide.eyebrow,
    animRootRef,
    [chatEyebrowAnimKey],
  );

  const paletteKey = (themeKey ?? slide.theme ?? "dark") as ThemeKey;
  const t = THEMES[paletteKey] ?? THEMES.dark;
  const align = slide.align ?? "left";
  const { showTag, showNum } = globalStyle;
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

  const chatBubbles = getChatBubbleList(slide);
  const chatShowFinal = staticChat || !runAnim;

  const termLine = slide.term || "where ideas get built today";
  const termTypeDelay =
    STAGGER_BASE_MS +
    (slide.eyebrow?.trim() ? STAGGER_STEP_MS : 0) +
    480;

  let body: React.ReactNode = null;

  if (slide.layout === "headline") {
    body = (
      <div ref={animRootRef} className="s-body" style={acs}>
        {slide.eyebrow ? (
          <div
            className="s-eyebrow"
            data-animate
            style={{ color: t.muted }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar"
          data-animate
          style={{ background: t.accent, ...barMarginHeadline }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            data-animate
            style={{ color: t.text, fontSize: fs }}
          >
            {linesToBr(slide.headline)}
          </div>
        ) : null}
        {slide.body ? (
          <div
            className="s-bt"
            data-animate
            style={{ color: t.muted, ...autoM }}
          >
            {slide.body}
          </div>
        ) : null}
      </div>
    );
  } else if (slide.layout === "chat") {
    body = (
      <div
        ref={animRootRef}
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
            data-animate
            style={{ color: t.muted, marginBottom: 14 }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div ref={chatContainerRef} className="s-chat">
          {chatBubbles.map((b, i) => {
            const wrap = chatBubbleShouldWrap(b.txt);
            return (
              <div
                key={b.key}
                className={`s-brow ${b.d === "out" ? "out" : ""}`}
                data-bi={i}
                style={
                  chatShowFinal
                    ? { opacity: 1, transform: "none" }
                    : {
                        opacity: 0,
                        transform: "translateY(8px)",
                      }
                }
              >
                <div className="s-bwrap">
                  <div className="s-bname" style={{ color: t.muted }}>
                    {b.nm}
                  </div>
                  <div
                    className={`s-bubble ${b.d}${wrap ? " s-bubble-wrap" : ""}`}
                    style={{
                      background: b.d === "in" ? t.bIn : t.bOut,
                      color: b.d === "in" ? t.bInT : t.bOutT,
                    }}
                  >
                    {wrap ? linesToBr(b.txt) : b.txt}
                  </div>
                  <div className="s-bmeta" style={{ color: t.muted }}>
                    {b.time}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else if (slide.layout === "stat") {
    const sts = [
      slide.s1n ? { n: slide.s1n, l: slide.s1l } : null,
      slide.s2n ? { n: slide.s2n, l: slide.s2l } : null,
    ].filter(Boolean) as { n: string; l: string }[];

    body = (
      <div ref={animRootRef} className="s-body" style={acs}>
        {slide.eyebrow ? (
          <div
            className="s-eyebrow"
            data-animate
            style={{ color: t.muted }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar"
          data-animate
          style={{ background: t.accent, ...barMarginStatList }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            data-animate
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
            <div key={i} className="s-stat" data-animate>
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
      <div ref={animRootRef} className="s-body" style={acs}>
        {slide.eyebrow ? (
          <div
            className="s-eyebrow"
            data-animate
            style={{ color: t.muted }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-bar"
          data-animate
          style={{ background: t.accent, ...barMarginStatList }}
        />
        {slide.headline ? (
          <div
            className="s-hl"
            data-animate
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
            <div
              key={i}
              className="s-li"
              data-animate
              style={{ color: t.text }}
            >
              <div className="s-ldot" style={{ background: t.accent }} />
              {it}
            </div>
          ))}
        </div>
      </div>
    );
  } else if (slide.layout === "terminal") {
    body = (
      <div ref={animRootRef} className="s-body">
        {slide.eyebrow ? (
          <div
            className="s-eyebrow"
            data-animate
            style={{ color: t.muted }}
          >
            {slide.eyebrow}
          </div>
        ) : null}
        <div
          className="s-term"
          style={{ background: t.term, color: t.termT }}
        >
          <div className="s-term-stage" data-animate>
            <span className="s-tpr" style={{ color: t.accent }}>
              {"➜  eyay:"}
            </span>
            <span className="s-tcmd-text">
              {runAnim ? (
                <TypewriterText
                  text={termLine}
                  active
                  startDelayMs={termTypeDelay}
                  resetKey={`${slide.id}\0${termLine}`}
                />
              ) : (
                termLine
              )}
            </span>
            <span className="s-tcur" style={{ background: t.accent }} />
          </div>
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

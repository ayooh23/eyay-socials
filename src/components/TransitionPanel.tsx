"use client";

import type { GlobalStyle, Slide, ThemeKey } from "@/lib/types";
import { xTransition, type ProgressFn, type ToastFn } from "@/lib/export";

export interface TransitionPanelProps {
  slide: Slide;
  cur: number;
  totalSlides: number;
  globalStyle: GlobalStyle;
  onProgress: ProgressFn;
  onToast: ToastFn;
}

export default function TransitionPanel({
  slide,
  cur,
  totalSlides,
  globalStyle,
  onProgress,
  onToast,
}: TransitionPanelProps) {
  const run = (from: ThemeKey, to: ThemeKey) =>
    xTransition(
      slide,
      from,
      to,
      cur,
      totalSlides,
      globalStyle,
      onProgress,
      onToast,
    );

  return (
    <div className="sb">
      <div className="sbl">transition video</div>
      <div
        style={{
          fontSize: 10,
          color: "var(--text3)",
          lineHeight: 1.7,
          marginBottom: 10,
          fontFamily: "var(--mono)",
        }}
      >
        Renders current slide fading between two themes. 3 sec · 1080×1350 ·
        30fps · H.264 .mp4 when your browser supports it.
      </div>
      <button
        type="button"
        className="btn btn-g btn-w btn-sm"
        style={{ marginBottom: 5 }}
        onClick={() => run("dark", "light")}
      >
        ↓ dark → light
      </button>
      <button
        type="button"
        className="btn btn-g btn-w btn-sm"
        onClick={() => run("light", "dark")}
      >
        ↓ light → dark
      </button>
    </div>
  );
}

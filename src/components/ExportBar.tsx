"use client";

import type { GlobalStyle, Slide } from "@/lib/types";
import {
  xAllPNG,
  xGIF,
  xPNG,
  xVideo,
  type ProgressFn,
  type ToastFn,
} from "@/lib/export";

export interface ExportBarProps {
  slides: Slide[];
  cur: number;
  globalStyle: GlobalStyle;
  onProgress: ProgressFn;
  onToast: ToastFn;
}

export default function ExportBar({
  slides,
  cur,
  globalStyle,
  onProgress,
  onToast,
}: ExportBarProps) {
  const slide = slides[cur];
  if (!slide) return null;

  return (
    <div className="xbar">
      <span className="xlabel">export</span>
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          xPNG(slide, cur, slides.length, globalStyle, onProgress, onToast)
        }
      >
        ↓ PNG
      </button>
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() => xAllPNG(slides, globalStyle, onProgress, onToast)}
      >
        ↓ all PNG
      </button>
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() => xGIF(slides, globalStyle, onProgress, onToast)}
      >
        ↓ GIF
      </button>
      <button
        type="button"
        className="btn btn-p btn-sm"
        onClick={() => xVideo(slides, globalStyle, onProgress, onToast)}
      >
        ↓ video
      </button>
    </div>
  );
}

"use client";

import type { GlobalStyle, Slide } from "@/lib/types";
import {
  xAllPNG,
  xGIF,
  xPNG,
  xSlideVideo,
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
        className="btn btn-g btn-sm"
        title="Current slide only. H.264 MP4 when supported (e.g. Chrome); otherwise WebM."
        onClick={() =>
          xSlideVideo(slide, cur, slides.length, globalStyle, onProgress, onToast)
        }
      >
        ↓ slide video
      </button>
      <button
        type="button"
        className="btn btn-p btn-sm"
        title="Encodes as H.264 MP4 when your browser supports it (e.g. Chrome); otherwise WebM."
        onClick={() => xVideo(slides, globalStyle, onProgress, onToast)}
      >
        ↓ video
      </button>
    </div>
  );
}

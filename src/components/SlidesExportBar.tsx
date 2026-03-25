"use client";

import type { GlobalStyle, SlidesSlide } from "@/lib/types";
import {
  xAllSlidesPNG,
  xSlidesPDF,
  xSlidesPNG,
  type ProgressFn,
  type ToastFn,
} from "@/lib/export";

export interface SlidesExportBarProps {
  slides: SlidesSlide[];
  cur: number;
  globalStyle: GlobalStyle;
  onProgress: ProgressFn;
  onToast: ToastFn;
}

export default function SlidesExportBar({
  slides,
  cur,
  globalStyle,
  onProgress,
  onToast,
}: SlidesExportBarProps) {
  const slide = slides[cur];
  if (!slide) return null;

  return (
    <div className="xbar">
      <span className="xlabel">export</span>
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          xSlidesPNG(slide, cur, slides.length, globalStyle, onProgress, onToast)
        }
      >
        ↓ PNG
      </button>
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          xAllSlidesPNG(slides, globalStyle, onProgress, onToast)
        }
      >
        ↓ all PNG
      </button>
      <button
        type="button"
        className="btn btn-p btn-sm"
        onClick={() =>
          xSlidesPDF(slides, globalStyle, onProgress, onToast)
        }
      >
        ↓ PDF
      </button>
    </div>
  );
}

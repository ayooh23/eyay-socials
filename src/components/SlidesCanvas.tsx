"use client";

import DeckSlideRenderer from "@/components/DeckSlideRenderer";
import type { GlobalStyle, SlidesSlide } from "@/lib/types";

export interface SlidesCanvasProps {
  slide: SlidesSlide;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
}

export default function SlidesCanvas({
  slide,
  globalStyle,
  slideIndex,
  totalSlides,
}: SlidesCanvasProps) {
  return (
    <div className="sf-outer sf-outer--slides">
      <div id="slide-canvas--slides">
        <DeckSlideRenderer
          slide={slide}
          globalStyle={globalStyle}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
        />
      </div>
    </div>
  );
}

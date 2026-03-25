"use client";

import SlideRenderer from "@/components/SlideRenderer";
import { useChatAnimation } from "@/hooks/useChatAnimation";
import type { GlobalStyle, Slide } from "@/lib/types";

export interface ExportAnimatedSlideProps {
  slide: Slide;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
}

/**
 * Offscreen slide used only for animated video export — runs the same chat hook as the editor preview.
 */
export function ExportAnimatedSlide({
  slide,
  globalStyle,
  slideIndex,
  totalSlides,
}: ExportAnimatedSlideProps) {
  const chatEnabled = slide.layout === "chat";
  const chatRef = useChatAnimation(slide, chatEnabled);

  return (
    <SlideRenderer
      slide={slide}
      globalStyle={globalStyle}
      slideIndex={slideIndex}
      totalSlides={totalSlides}
      staticChat={false}
      animate
      chatContainerRef={chatEnabled ? chatRef : undefined}
    />
  );
}

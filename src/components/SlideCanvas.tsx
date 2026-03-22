"use client";

import SlideRenderer from "@/components/SlideRenderer";
import { useChatAnimation } from "@/hooks/useChatAnimation";
import type { GlobalStyle, Slide } from "@/lib/types";

export interface SlideCanvasProps {
  slide: Slide;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
}

export default function SlideCanvas({
  slide,
  globalStyle,
  slideIndex,
  totalSlides,
}: SlideCanvasProps) {
  const chatEnabled = slide.layout === "chat";
  const chatRef = useChatAnimation(slide, chatEnabled);

  return (
    <div className="sf-outer">
      <div id="slide-canvas">
        <SlideRenderer
          slide={slide}
          globalStyle={globalStyle}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
          staticChat={false}
          chatContainerRef={chatEnabled ? chatRef : undefined}
        />
      </div>
    </div>
  );
}

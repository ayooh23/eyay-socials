"use client";

import SlideRenderer from "@/components/SlideRenderer";
import { useChatAnimation } from "@/hooks/useChatAnimation";
import type { GlobalStyle, Slide } from "@/lib/types";

export interface SlideCanvasProps {
  slide: Slide;
  globalStyle: GlobalStyle;
  slideIndex: number;
  totalSlides: number;
  /** When false, chat/stagger/typewriter stay static (e.g. embedded preview). */
  animate?: boolean;
}

export default function SlideCanvas({
  slide,
  globalStyle,
  slideIndex,
  totalSlides,
  animate = true,
}: SlideCanvasProps) {
  const chatEnabled = slide.layout === "chat";
  const chatRef = useChatAnimation(slide, chatEnabled && animate);

  return (
    <div className="sf-outer">
      <div id="slide-canvas">
        <SlideRenderer
          slide={slide}
          globalStyle={globalStyle}
          slideIndex={slideIndex}
          totalSlides={totalSlides}
          staticChat={false}
          animate={animate}
          chatContainerRef={chatEnabled ? chatRef : undefined}
        />
      </div>
    </div>
  );
}

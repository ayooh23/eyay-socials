"use client";

import { useEffect, useRef } from "react";
import type { Slide } from "@/lib/types";

const SPEEDS = {
  normal: { f: 500, g: 800 },
  fast: { f: 280, g: 430 },
  slow: { f: 850, g: 1300 },
} as const;

/**
 * Animates chat bubble rows inside the attached container ([data-bi]).
 * Reset/replay when slide chat content or speed changes.
 */
export function useChatAnimation(slide: Slide, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || slide.layout !== "chat") return;
    const container = ref.current;
    if (!container) return;

    const rows = container.querySelectorAll<HTMLElement>("[data-bi]");
    const sp = SPEEDS[slide.chatSpeed || "normal"];
    const animIds: number[] = [];

    rows.forEach((r) => {
      r.style.transition = "none";
      r.style.opacity = "0";
      r.style.transform = "translateY(18px) scale(0.96)";
    });

    rows.forEach((r, i) => {
      const id = window.setTimeout(() => {
        r.style.transition =
          "opacity 0.42s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.42s cubic-bezier(0.34, 1.56, 0.64, 1)";
        r.style.opacity = "1";
        r.style.transform = "translateY(0) scale(1)";
      }, sp.f + i * sp.g);
      animIds.push(id);
    });

    return () => {
      animIds.forEach(clearTimeout);
    };
  }, [
    enabled,
    slide.layout,
    slide.chatSpeed,
    slide.m1,
    slide.m2,
    slide.m3,
    slide.sn1,
    slide.sn2,
  ]);

  return ref;
}

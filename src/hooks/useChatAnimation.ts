"use client";

import { useLayoutEffect, useRef } from "react";
import {
  CHAT_ROW_REVEAL_MS,
  CHAT_STAGGER_SPEEDS,
  EASE_OUT,
} from "@/lib/motion";
import type { Slide } from "@/lib/types";

const CHAT_REST = {
  opacity: "0",
  transform: "translateY(8px)",
} as const;

export function useChatAnimation(slide: Slide, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!enabled || slide.layout !== "chat") return;
    const container = ref.current;
    if (!container) return;

    const rows = container.querySelectorAll<HTMLElement>("[data-bi]");
    const sp = CHAT_STAGGER_SPEEDS[slide.chatSpeed || "normal"];
    const animIds: number[] = [];
    let cancelled = false;

    rows.forEach((r) => {
      r.getAnimations?.().forEach((a) => a.cancel());
      r.style.animation = "none";
      r.style.transition = "none";
      r.style.opacity = CHAT_REST.opacity;
      r.style.transform = CHAT_REST.transform;
      r.style.filter = "";
      r.style.willChange = "";
    });

    const raf = window.requestAnimationFrame(() => {
      if (cancelled) return;
      rows.forEach((r, i) => {
        const delay = sp.f + i * sp.g;
        r.style.willChange = "opacity, transform";
        r.style.animation = `s-chat-row-enter ${CHAT_ROW_REVEAL_MS}ms ${EASE_OUT} ${delay}ms both`;

        const settle = () => {
          r.style.willChange = "auto";
          r.removeEventListener("animationend", settle);
        };
        r.addEventListener("animationend", settle);
        animIds.push(
          window.setTimeout(settle, delay + CHAT_ROW_REVEAL_MS + 120),
        );
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      animIds.forEach(clearTimeout);
      rows.forEach((r) => {
        r.getAnimations?.().forEach((a) => a.cancel());
        r.style.animation = "";
        r.style.transition = "";
        r.style.opacity = "";
        r.style.transform = "";
        r.style.filter = "";
        r.style.willChange = "";
      });
    };
  }, [
    enabled,
    slide.layout,
    slide.id,
    slide.chatSpeed,
    JSON.stringify(slide.chatRows ?? []),
    slide.m1,
    slide.m2,
    slide.m3Lead,
    slide.m3,
    slide.m3b,
    slide.m3c,
    slide.m3Pick,
    slide.sn1,
    slide.sn2,
  ]);

  return ref;
}

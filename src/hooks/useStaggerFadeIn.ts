"use client";

import type { RefObject } from "react";
import { useLayoutEffect, useRef } from "react";
import {
  EASE_OUT,
  MOTION_REVEAL_MS,
  STAGGER_BASE_MS,
  STAGGER_STEP_MS,
} from "@/lib/motion";

export { STAGGER_BASE_MS, STAGGER_STEP_MS } from "@/lib/motion";

const BASE_MS = STAGGER_BASE_MS;
const STAGGER_MS = STAGGER_STEP_MS;

const MOTION_REST = {
  opacity: "0",
  transform: "translateY(16px)",
} as const;

export function useStaggerFadeIn(
  enabled: boolean,
  rootRef: RefObject<HTMLElement | null>,
  deps: readonly unknown[],
) {
  const gen = useRef(0);

  useLayoutEffect(() => {
    if (!enabled) return;
    const root = rootRef.current;
    if (!root) return;

    const myGen = ++gen.current;
    const els = root.querySelectorAll<HTMLElement>("[data-animate]");

    els.forEach((el) => {
      el.getAnimations?.().forEach((a) => a.cancel());
      el.style.animation = "none";
      el.style.transition = "none";
      el.style.opacity = MOTION_REST.opacity;
      el.style.transform = MOTION_REST.transform;
      el.style.filter = "";
      el.style.willChange = "";
    });

    const timeouts: number[] = [];

    const raf = window.requestAnimationFrame(() => {
      if (gen.current !== myGen) return;
      els.forEach((el, i) => {
        const delay = BASE_MS + i * STAGGER_MS;
        el.style.willChange = "opacity, transform";
        el.style.animation = `s-motion-reveal ${MOTION_REVEAL_MS}ms ${EASE_OUT} ${delay}ms both`;

        const settle = () => {
          el.style.willChange = "auto";
          el.removeEventListener("animationend", settle);
        };
        el.addEventListener("animationend", settle);
        timeouts.push(
          window.setTimeout(settle, delay + MOTION_REVEAL_MS + 120),
        );
      });
    });

    return () => {
      gen.current++;
      window.cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
      els.forEach((el) => {
        el.getAnimations?.().forEach((a) => a.cancel());
        el.style.animation = "";
        el.style.transition = "";
        el.style.opacity = "";
        el.style.transform = "";
        el.style.filter = "";
        el.style.willChange = "";
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, rootRef, ...deps]);
}

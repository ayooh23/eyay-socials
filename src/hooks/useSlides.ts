"use client";

import { useCallback, useState } from "react";
import type { Slide } from "@/lib/types";
import { createSlide } from "@/data/defaults";

export function useSlides(initialSlides: Slide[], initialCur = 0) {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [cur, setCur] = useState(initialCur);

  const selectSlide = useCallback((index: number) => {
    setCur(index);
  }, []);

  const addSlide = useCallback(() => {
    const s = createSlide({ layout: "headline", headline: "New slide", cta: "eyay.studio" });
    setSlides((prev) => {
      const next = [...prev];
      next.splice(cur + 1, 0, s);
      return next;
    });
    setCur((c) => c + 1);
  }, [cur]);

  const deleteSlide = useCallback((index: number) => {
    setSlides((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== index);
      setCur((c) => {
        if (c >= next.length) return next.length - 1;
        if (index < c) return c - 1;
        return c;
      });
      return next;
    });
  }, []);

  const reorderSlides = useCallback((from: number, to: number) => {
    if (from === to) return;
    setSlides((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setCur((c) => {
      if (c === from) return to;
      if (from < c && to >= c) return c - 1;
      if (from > c && to <= c) return c + 1;
      return c;
    });
  }, []);

  const resetSlides = useCallback((nextSlides: Slide[], nextCur = 0) => {
    setSlides(nextSlides);
    setCur(nextCur);
  }, []);

  const patchSlideById = useCallback((slideId: string, patch: Partial<Slide>) => {
    if (!slideId) return;
    setSlides((prev) => {
      const j = prev.findIndex((s) => s.id === slideId);
      if (j < 0) return prev;
      const next = [...prev];
      next[j] = { ...next[j], ...patch };
      return next;
    });
  }, []);

  return {
    slides,
    cur,
    setSlides,
    setCur,
    patchSlideById,
    selectSlide,
    addSlide,
    deleteSlide,
    reorderSlides,
    resetSlides,
  };
}

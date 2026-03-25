"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import SlidesCanvas from "@/components/SlidesCanvas";
import SlidesExportBar from "@/components/SlidesExportBar";
import SlidesSidebarControls from "@/components/SlidesSidebarControls";
import SlideList from "@/components/SlideList";
import {
  createSlidesSlide,
  DEFAULT_GLOBAL_STYLE,
  DEFAULT_SLIDES_DECK,
  newSlideId,
} from "@/data/defaults";
import { useSlides } from "@/hooks/useSlides";
import type { Alignment, GlobalStyle, SlidesSlide, ThemeKey } from "@/lib/types";
import type { ProgressFn, ToastFn } from "@/lib/export";

const STORAGE_KEY = "eyay-slides-state";

export type SlidesHeaderApi = {
  resetAll: () => void;
  addSlide: () => void;
};

export interface SlidesTabProps {
  onProgress: ProgressFn;
  onToast: ToastFn;
  headerApiRef: RefObject<SlidesHeaderApi | null>;
  progressFooter: ReactNode;
}

export default function SlidesTab({
  onProgress,
  onToast,
  headerApiRef,
  progressFooter,
}: SlidesTabProps) {
  const createBlankDeckSlide = useCallback(
    () =>
      createSlidesSlide({
        layout: "title",
        headline: "New slide",
        cta: "eyay.studio",
      }),
    [],
  );

  const {
    slides: slidesS,
    cur: curS,
    selectSlide,
    addSlide,
    deleteSlide,
    reorderSlides,
    resetSlides,
    patchSlideById,
  } = useSlides(DEFAULT_SLIDES_DECK, 0, createBlankDeckSlide);

  const [globalStyleS, setGlobalStyleS] = useState<GlobalStyle>(
    DEFAULT_GLOBAL_STYLE,
  );

  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as {
          slides?: unknown;
          cur?: number;
          globalStyle?: Partial<GlobalStyle> & {
            theme?: ThemeKey;
            align?: Alignment;
          };
        };
        if (Array.isArray(p.slides) && p.slides.length > 0) {
          const c = typeof p.cur === "number" ? p.cur : 0;
          const clamped = Math.min(Math.max(0, c), p.slides.length - 1);
          const gs = p.globalStyle ?? {};
          const legacyTheme = gs.theme;
          const legacyAlign = gs.align;
          const normalized = (p.slides as Partial<SlidesSlide>[]).map((row) => {
            const s = row ?? {};
            const id =
              typeof s.id === "string" && s.id.length > 0 ? s.id : newSlideId();
            return createSlidesSlide({
              ...s,
              id,
              theme: s.theme ?? legacyTheme ?? "dark",
              align: s.align ?? legacyAlign ?? "left",
            });
          });
          const seen = new Set<string>();
          const withUniqueIds = normalized.map((s) => {
            if (!s.id || seen.has(s.id)) {
              const id = newSlideId();
              seen.add(id);
              return { ...s, id };
            }
            seen.add(s.id);
            return s;
          });
          resetSlides(withUniqueIds, clamped);
          setGlobalStyleS({
            ...DEFAULT_GLOBAL_STYLE,
            size: gs.size ?? DEFAULT_GLOBAL_STYLE.size,
            showTag: gs.showTag ?? DEFAULT_GLOBAL_STYLE.showTag,
            showNum: gs.showNum ?? DEFAULT_GLOBAL_STYLE.showNum,
            showDots: gs.showDots ?? DEFAULT_GLOBAL_STYLE.showDots,
          });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, [resetSlides]);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          slides: slidesS,
          cur: curS,
          globalStyle: globalStyleS,
        }),
      );
    }, 500);
    return () => clearTimeout(t);
  }, [slidesS, curS, globalStyleS, hydrated]);

  const current = slidesS[curS];

  const goPrev = useCallback(() => {
    if (curS > 0) selectSlide(curS - 1);
  }, [curS, selectSlide]);

  const goNext = useCallback(() => {
    if (curS < slidesS.length - 1) selectSlide(curS + 1);
  }, [curS, slidesS.length, selectSlide]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [goPrev, goNext]);

  const resetAll = useCallback(() => {
    if (confirm("Reset all slides?")) {
      resetSlides(DEFAULT_SLIDES_DECK, 0);
      setGlobalStyleS(DEFAULT_GLOBAL_STYLE);
    }
  }, [resetSlides]);

  const patchGlobal = (patch: Partial<GlobalStyle>) => {
    setGlobalStyleS((g) => ({ ...g, ...patch }));
  };

  useEffect(() => {
    headerApiRef.current = { resetAll, addSlide };
    return () => {
      headerApiRef.current = null;
    };
  }, [headerApiRef, resetAll, addSlide]);

  if (!current) {
    return null;
  }

  return (
    <>
      <aside>
        <SlideList
          slides={slidesS}
          cur={curS}
          onSelect={selectSlide}
          onDelete={deleteSlide}
          onReorder={reorderSlides}
          onAdd={addSlide}
        />
        <SlidesSidebarControls
          slide={current}
          globalStyle={globalStyleS}
          onPatchSlide={patchSlideById}
          onChangeGlobal={patchGlobal}
        />
      </aside>

      <main>
        <div className="cwrap">
          <SlidesCanvas
            slide={current}
            globalStyle={globalStyleS}
            slideIndex={curS}
            totalSlides={slidesS.length}
          />

          <div className="slide-nav">
            <button
              type="button"
              className="nav-btn"
              disabled={curS === 0}
              onClick={goPrev}
            >
              ←
            </button>
            <span className="nav-c">
              {curS + 1} / {slidesS.length}
            </span>
            <button
              type="button"
              className="nav-btn"
              disabled={curS >= slidesS.length - 1}
              onClick={goNext}
            >
              →
            </button>
          </div>

          <SlidesExportBar
            slides={slidesS}
            cur={curS}
            globalStyle={globalStyleS}
            onProgress={onProgress}
            onToast={onToast}
          />

          {progressFooter}
        </div>
      </main>
    </>
  );
}

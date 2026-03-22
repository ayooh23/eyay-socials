"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import ExportBar from "@/components/ExportBar";
import SidebarControls from "@/components/SidebarControls";
import SlideCanvas from "@/components/SlideCanvas";
import SlideList from "@/components/SlideList";
import TransitionPanel from "@/components/TransitionPanel";
import {
  createSlide,
  DEFAULT_GLOBAL_STYLE,
  DEFAULT_SLIDES,
  newSlideId,
} from "@/data/defaults";
import { useSlides } from "@/hooks/useSlides";
import type {
  Alignment,
  GlobalStyle,
  Slide,
  ThemeKey,
} from "@/lib/types";
import type { ProgressFn, ToastFn } from "@/lib/export";

const STORAGE_KEY = "eyay-socials-state";

export type CarouselHeaderApi = {
  resetAll: () => void;
  addSlide: () => void;
};

export interface CarouselTabProps {
  onProgress: ProgressFn;
  onToast: ToastFn;
  headerApiRef: RefObject<CarouselHeaderApi | null>;
  progressFooter: ReactNode;
}

export default function CarouselTab({
  onProgress,
  onToast,
  headerApiRef,
  progressFooter,
}: CarouselTabProps) {
  const {
    slides,
    cur,
    selectSlide,
    addSlide,
    deleteSlide,
    reorderSlides,
    resetSlides,
    patchSlideById,
  } = useSlides(DEFAULT_SLIDES, 0);

  const [globalStyle, setGlobalStyle] = useState<GlobalStyle>(
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
          const normalized = (p.slides as Partial<Slide>[]).map((row) => {
            const s = row ?? {};
            const id =
              typeof s.id === "string" && s.id.length > 0 ? s.id : newSlideId();
            return createSlide({
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
          setGlobalStyle({
            ...DEFAULT_GLOBAL_STYLE,
            size: gs.size ?? DEFAULT_GLOBAL_STYLE.size,
            showTag: gs.showTag ?? DEFAULT_GLOBAL_STYLE.showTag,
            showNum: gs.showNum ?? DEFAULT_GLOBAL_STYLE.showNum,
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
        JSON.stringify({ slides, cur, globalStyle }),
      );
    }, 500);
    return () => clearTimeout(t);
  }, [slides, cur, globalStyle, hydrated]);

  const current = slides[cur];

  const goPrev = useCallback(() => {
    if (cur > 0) selectSlide(cur - 1);
  }, [cur, selectSlide]);

  const goNext = useCallback(() => {
    if (cur < slides.length - 1) selectSlide(cur + 1);
  }, [cur, slides.length, selectSlide]);

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
      resetSlides(DEFAULT_SLIDES, 0);
      setGlobalStyle(DEFAULT_GLOBAL_STYLE);
    }
  }, [resetSlides]);

  const patchGlobal = (patch: Partial<GlobalStyle>) => {
    setGlobalStyle((g) => ({ ...g, ...patch }));
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
          slides={slides}
          cur={cur}
          onSelect={selectSlide}
          onDelete={deleteSlide}
          onReorder={reorderSlides}
          onAdd={addSlide}
        />
        <SidebarControls
          slide={current}
          globalStyle={globalStyle}
          onPatchSlide={patchSlideById}
          onChangeGlobal={patchGlobal}
        />
        <TransitionPanel
          slide={current}
          cur={cur}
          totalSlides={slides.length}
          globalStyle={globalStyle}
          onProgress={onProgress}
          onToast={onToast}
        />
      </aside>

      <main>
        <div className="cwrap">
          <SlideCanvas
            slide={current}
            globalStyle={globalStyle}
            slideIndex={cur}
            totalSlides={slides.length}
          />

          <div className="slide-nav">
            <button
              type="button"
              className="nav-btn"
              disabled={cur === 0}
              onClick={goPrev}
            >
              ←
            </button>
            <span className="nav-c">
              {cur + 1} / {slides.length}
            </span>
            <button
              type="button"
              className="nav-btn"
              disabled={cur >= slides.length - 1}
              onClick={goNext}
            >
              →
            </button>
          </div>

          <ExportBar
            slides={slides}
            cur={cur}
            globalStyle={globalStyle}
            onProgress={onProgress}
            onToast={onToast}
          />

          {progressFooter}
        </div>
      </main>
    </>
  );
}

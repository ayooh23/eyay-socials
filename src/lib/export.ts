"use client";

import { createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import DeckSlideRenderer from "@/components/DeckSlideRenderer";
import SlideRenderer from "@/components/SlideRenderer";
import {
  STAGGER_BASE_MS,
  STAGGER_STEP_MS,
  TYPEWRITER_CHAR_MS,
  easeInOutSine,
} from "@/lib/motion";
import type {
  GlobalStyle,
  Slide,
  SlidesSlide,
  ThemeKey,
} from "@/lib/types";

/** Pass pct &lt; 0 to hide the progress bar immediately (export errors). */
export type ProgressFn = (label: string, pct: number) => void;
export type ToastFn = (message: string) => void;

export const CAROUSEL_CAPTURE = { w: 1080, h: 1350 } as const;
export const SLIDES_CAPTURE = { w: 1920, h: 1080 } as const;

export type CaptureDimensions = { w: number; h: number };

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

function doubleRaf(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/* ================================================================
 * Slide-video export: JS-driven frame-by-frame animation engine.
 *
 * We mount the slide fully static (animate=false, staticChat=true)
 * so NO React hooks or CSS animations compete. Then:
 *   1. Read natural opacities from the DOM
 *   2. Hide animated elements + clear typewriter text
 *   3. Pre-render every frame with JS-computed inline styles
 *      (only opacity + 2D transform — html2canvas compatible)
 *   4. Encode pre-rendered frames at real-time playback speed
 * ================================================================ */

const EXPORT_FPS = 30;
const EXPORT_SCALE = 2;

const XANIM_DUR_STAGGER = 500;
const XANIM_DUR_CHAT = 500;

const CHAT_EXPORT_SPEEDS = {
  normal: { f: 300, g: 480 },
  fast: { f: 180, g: 320 },
  slow: { f: 500, g: 720 },
} as const;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}

type XAnimKind = "stagger" | "chat" | "typewriter";
interface XAnimTarget {
  el: HTMLElement;
  kind: XAnimKind;
  delay: number;
  dur: number;
  targetOpacity: number;
  fullText?: string;
}

function gatherXAnimTargets(
  root: HTMLElement,
  slide: Slide,
): XAnimTarget[] {
  const targets: XAnimTarget[] = [];

  if (slide.layout === "chat") {
    const eyebrow = root.querySelector<HTMLElement>(
      ".s-eyebrow[data-animate]",
    );
    if (eyebrow) {
      targets.push({
        el: eyebrow,
        kind: "stagger",
        delay: STAGGER_BASE_MS,
        dur: XANIM_DUR_STAGGER,
        targetOpacity: parseFloat(getComputedStyle(eyebrow).opacity) || 1,
      });
    }
    const sp = CHAT_EXPORT_SPEEDS[slide.chatSpeed || "normal"];
    root.querySelectorAll<HTMLElement>("[data-bi]").forEach((el, i) => {
      targets.push({
        el,
        kind: "chat",
        delay: sp.f + i * sp.g,
        dur: XANIM_DUR_CHAT,
        targetOpacity: 1,
      });
    });
  } else if (slide.layout === "terminal") {
    const staggerEls = root.querySelectorAll<HTMLElement>("[data-animate]");
    staggerEls.forEach((el, i) => {
      targets.push({
        el,
        kind: "stagger",
        delay: STAGGER_BASE_MS + i * STAGGER_STEP_MS,
        dur: XANIM_DUR_STAGGER,
        targetOpacity: parseFloat(getComputedStyle(el).opacity) || 1,
      });
    });
    const textEl = root.querySelector<HTMLElement>(".s-tcmd-text");
    if (textEl) {
      const full = textEl.textContent || "";
      const charStartDelay =
        STAGGER_BASE_MS +
        Math.max(0, staggerEls.length - 1) * STAGGER_STEP_MS +
        Math.round(XANIM_DUR_STAGGER * 0.7);
      targets.push({
        el: textEl,
        kind: "typewriter",
        delay: charStartDelay,
        dur: full.length * TYPEWRITER_CHAR_MS,
        targetOpacity: 1,
        fullText: full,
      });
    }
  } else {
    root.querySelectorAll<HTMLElement>("[data-animate]").forEach((el, i) => {
      targets.push({
        el,
        kind: "stagger",
        delay: STAGGER_BASE_MS + i * STAGGER_STEP_MS,
        dur: XANIM_DUR_STAGGER,
        targetOpacity: parseFloat(getComputedStyle(el).opacity) || 1,
      });
    });
  }
  return targets;
}

function initXAnimTargets(targets: XAnimTarget[]) {
  for (const t of targets) {
    switch (t.kind) {
      case "stagger":
        t.el.style.opacity = "0";
        t.el.style.transform = "translateY(16px)";
        break;
      case "chat":
        t.el.style.opacity = "0";
        t.el.style.transform = "translateY(12px)";
        break;
      case "typewriter":
        t.el.textContent = "";
        break;
    }
  }
}

function setXAnimFrame(targets: XAnimTarget[], ms: number) {
  for (const t of targets) {
    const raw = (ms - t.delay) / Math.max(t.dur, 1);
    const p = Math.max(0, Math.min(1, raw));

    switch (t.kind) {
      case "stagger": {
        if (p <= 0) {
          t.el.style.opacity = "0";
          t.el.style.transform = "translateY(16px)";
        } else if (p >= 1) {
          t.el.style.opacity = String(t.targetOpacity);
          t.el.style.transform = "";
        } else {
          const oE = easeOutCubic(p);
          const mE = easeOutQuart(p);
          t.el.style.opacity = String(oE * t.targetOpacity);
          t.el.style.transform = `translateY(${(16 * (1 - mE)).toFixed(2)}px)`;
        }
        break;
      }
      case "chat": {
        if (p <= 0) {
          t.el.style.opacity = "0";
          t.el.style.transform = "translateY(12px)";
        } else if (p >= 1) {
          t.el.style.opacity = "1";
          t.el.style.transform = "";
        } else {
          const oE = easeOutCubic(p);
          const mE = easeOutQuart(p);
          t.el.style.opacity = String(oE);
          t.el.style.transform = `translateY(${(12 * (1 - mE)).toFixed(2)}px)`;
        }
        break;
      }
      case "typewriter": {
        const full = t.fullText!;
        if (p <= 0) {
          t.el.textContent = "";
        } else if (p >= 1) {
          t.el.textContent = full;
        } else {
          const n = Math.min(full.length, Math.floor(p * full.length) + 1);
          t.el.textContent = full.slice(0, n);
        }
        break;
      }
    }
  }
}

/**
 * Export-only DOM overrides — compensates for html2canvas rendering
 * differences at 2x scale without touching the preview CSS.
 */
function patchDomForExport(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>(".s-bubble").forEach((el) => {
    el.style.padding = "22px 26px";
  });

  root.querySelectorAll<HTMLElement>(".s-tcur").forEach((el) => {
    el.style.animation = "none";
    el.style.opacity = "1";
    el.style.verticalAlign = "baseline";
    el.style.position = "relative";
    el.style.top = "4px";
  });
}

function loadScript(src: string) {
  return new Promise<void>((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function dl(canvas: HTMLCanvasElement, name: string) {
  const a = document.createElement("a");
  a.download = name;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function dlURL(url: string, name: string) {
  const a = document.createElement("a");
  a.download = name;
  a.href = url;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 20000);
}

function pickVideoRecorderFormat(): {
  mimeType: string;
  blobType: string;
  ext: "mp4" | "webm";
} {
  const mp4Candidates = [
    "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
    "video/mp4;codecs=avc1.42E01E",
    "video/mp4;codecs=avc1.42001E,mp4a.40.2",
    "video/mp4;codecs=avc1.4D401E",
    "video/mp4;codecs=avc1.640028",
    "video/mp4",
  ];
  for (const mimeType of mp4Candidates) {
    if (MediaRecorder.isTypeSupported(mimeType)) {
      return {
        mimeType,
        blobType: "video/mp4",
        ext: "mp4",
      };
    }
  }
  const webm = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
    ? "video/webm;codecs=vp9"
    : "video/webm";
  return {
    mimeType: webm,
    blobType: "video/webm",
    ext: "webm",
  };
}

async function captureOffscreen(
  node: ReactElement,
  dimensions: CaptureDimensions,
  settleMs: number,
): Promise<HTMLCanvasElement> {
  const { w, h } = dimensions;
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:-99999px;width:${w}px;height:${h}px;overflow:hidden;pointer-events:none;z-index:-1;`;
  const inner = document.createElement("div");
  inner.style.cssText = `position:relative;width:${w}px;height:${h}px;overflow:hidden;font-family:var(--sans, 'DM Sans', system-ui, sans-serif);`;
  host.appendChild(inner);
  document.body.appendChild(host);

  const root = createRoot(inner);
  root.render(node);

  await sleep(settleMs);

  const canvas = await html2canvas(inner, {
    scale: 1,
    width: w,
    height: h,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  root.unmount();
  document.body.removeChild(host);

  return canvas;
}

export async function captureSlide(
  slide: Slide,
  themeKey: ThemeKey,
  slideIndex: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
  dimensions: CaptureDimensions = CAROUSEL_CAPTURE,
): Promise<HTMLCanvasElement> {
  const settleMs = slide.layout === "chat" ? 175 : 90;
  return captureOffscreen(
    createElement(SlideRenderer, {
      slide,
      themeKey,
      globalStyle,
      slideIndex,
      totalSlides,
      staticChat: true,
      animate: false,
    }),
    dimensions,
    settleMs,
  );
}

export async function captureSlidesSlide(
  slide: SlidesSlide,
  slideIndex: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
  dimensions: CaptureDimensions = SLIDES_CAPTURE,
): Promise<HTMLCanvasElement> {
  const settleMs = slide.layout === "chat" ? 175 : 90;
  return captureOffscreen(
    createElement(DeckSlideRenderer, {
      slide,
      globalStyle,
      slideIndex,
      totalSlides,
    }),
    dimensions,
    settleMs,
  );
}

export async function xPNG(
  slide: Slide,
  idx: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  try {
    onProgress("rendering…", 20);
    const c = await captureSlide(
      slide,
      slide.theme,
      idx,
      totalSlides,
      globalStyle,
      CAROUSEL_CAPTURE,
    );
    onProgress("saving…", 85);
    dl(c, `eyay-${String(idx + 1).padStart(2, "0")}.png`);
    onProgress("done ✓", 100);
    onToast("PNG saved — 1080×1350");
  } catch (e) {
    onToast(`PNG failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function xAllPNG(
  slides: Slide[],
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  try {
    for (let i = 0; i < slides.length; i++) {
      onProgress(
        `slide ${i + 1}/${slides.length}`,
        Math.round((i / slides.length) * 90),
      );
      const c = await captureSlide(
        slides[i],
        slides[i].theme,
        i,
        slides.length,
        globalStyle,
        CAROUSEL_CAPTURE,
      );
      dl(c, `eyay-${String(i + 1).padStart(2, "0")}.png`);
      await sleep(160);
    }
    onProgress("done ✓", 100);
    onToast(`${slides.length} PNGs saved`);
  } catch (e) {
    onToast(`Export failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function xSlidesPNG(
  slide: SlidesSlide,
  idx: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  try {
    onProgress("rendering…", 20);
    const c = await captureSlidesSlide(
      slide,
      idx,
      totalSlides,
      globalStyle,
      SLIDES_CAPTURE,
    );
    onProgress("saving…", 85);
    dl(c, `eyay-slide-${String(idx + 1).padStart(2, "0")}.png`);
    onProgress("done ✓", 100);
    onToast("PNG saved — 1920×1080");
  } catch (e) {
    onToast(`PNG failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function xAllSlidesPNG(
  slides: SlidesSlide[],
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  try {
    for (let i = 0; i < slides.length; i++) {
      onProgress(
        `slide ${i + 1}/${slides.length}`,
        Math.round((i / slides.length) * 90),
      );
      const c = await captureSlidesSlide(
        slides[i],
        i,
        slides.length,
        globalStyle,
        SLIDES_CAPTURE,
      );
      dl(c, `eyay-slide-${String(i + 1).padStart(2, "0")}.png`);
      await sleep(160);
    }
    onProgress("done ✓", 100);
    onToast(`${slides.length} PNGs saved`);
  } catch (e) {
    onToast(`Export failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function xSlidesPDF(
  slides: SlidesSlide[],
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  onProgress("building PDF…", 4);
  try {
    const { exportSlidesDeckPdf } = await import("@/lib/slidesPdfExport");
    await exportSlidesDeckPdf(slides, globalStyle, onProgress);
    onToast("PDF saved — eyay-slides.pdf (1920×1080 · text)");
  } catch (e) {
    onToast(`PDF failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function xGIF(
  slides: Slide[],
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  onProgress("loading encoder…", 5);
  try {
    const w = window as unknown as {
      gifshot?: {
        createGIF: (
          opts: Record<string, unknown>,
          cb: (obj: { error?: string; image?: string }) => void,
        ) => void;
      };
    };
    if (!w.gifshot) {
      await loadScript(
        "https://cdnjs.cloudflare.com/ajax/libs/gifshot/0.4.5/gifshot.min.js",
      );
    }
    const gifshot =
      w.gifshot ??
      (globalThis as unknown as typeof w).gifshot;
    if (!gifshot) throw new Error("gifshot failed to load");
    const frames: string[] = [];
    const { w: cw, h: ch } = CAROUSEL_CAPTURE;
    for (let i = 0; i < slides.length; i++) {
      onProgress(
        `frame ${i + 1}/${slides.length}`,
        10 + Math.round((i / slides.length) * 65),
      );
      const c = await captureSlide(
        slides[i],
        slides[i].theme,
        i,
        slides.length,
        globalStyle,
        CAROUSEL_CAPTURE,
      );
      frames.push(c.toDataURL("image/png"));
    }
    onProgress("encoding GIF…", 80);
    await new Promise<void>((res, rej) => {
      gifshot.createGIF(
        {
          images: frames,
          gifWidth: cw,
          gifHeight: ch,
          interval: 1.8,
          sampleInterval: 12,
          numWorkers: 2,
        },
        (obj: { error?: string; image?: string }) => {
          if (!obj.error && obj.image) {
            dlURL(obj.image, "eyay-carousel.gif");
            onProgress("done ✓", 100);
            onToast("GIF saved");
            res();
          } else rej(new Error(obj.error || "GIF encode failed"));
        },
      );
    });
  } catch (e) {
    onToast(`GIF failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function xVideo(
  slides: Slide[],
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  try {
    const cs: HTMLCanvasElement[] = [];
    for (let i = 0; i < slides.length; i++) {
      onProgress(
        `slide ${i + 1}/${slides.length}`,
        10 + Math.round((i / slides.length) * 42),
      );
      cs.push(
        await captureSlide(
          slides[i],
          slides[i].theme,
          i,
          slides.length,
          globalStyle,
          CAROUSEL_CAPTURE,
        ),
      );
    }
    const { ext } = await encodeSlides(
      cs,
      2.4,
      0.32,
      "eyay-carousel",
      onProgress,
      CAROUSEL_CAPTURE,
    );
    onToast(`Video saved — 1080×1350 .${ext}`);
  } catch (e) {
    onToast(`Video failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

/**
 * Animated slide video — two-phase pipeline:
 *   Phase 1  Mount fully static slide, gather targets, pre-render
 *            every frame with JS-computed inline styles.
 *   Phase 2  Encode pre-rendered frames at real-time playback speed.
 *
 * Terminal → typewriter (char-by-char)
 * Chat    → fade + slide up
 * Others  → staggered fade + slide up
 */
export async function xSlideVideo(
  slide: Slide,
  slideIndex: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  const { w, h } = CAROUSEL_CAPTURE;
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-99999px;top:-99999px;width:${w}px;height:${h}px;overflow:hidden;pointer-events:none;z-index:-1;`;
  const inner = document.createElement("div");
  inner.style.cssText = `position:relative;width:${w}px;height:${h}px;overflow:hidden;font-family:var(--sans, 'DM Sans', system-ui, sans-serif);`;
  host.appendChild(inner);

  let root: ReturnType<typeof createRoot> | null = null;
  try {
    onProgress("preparing…", 2);
    document.body.appendChild(host);
    root = createRoot(inner);

    root.render(
      createElement(SlideRenderer, {
        slide,
        globalStyle,
        slideIndex,
        totalSlides,
        staticChat: true,
        animate: false,
      }),
    );

    await doubleRaf();
    await sleep(200);

    patchDomForExport(inner);

    const targets = gatherXAnimTargets(inner, slide);
    initXAnimTargets(targets);
    void inner.offsetHeight;

    const animEndMs = targets.reduce(
      (max, t) => Math.max(max, t.delay + t.dur),
      0,
    );
    const holdMs = 1500;
    const totalMs = Math.max(2400, animEndMs + holdMs);
    const totalFrames = Math.ceil((totalMs / 1000) * EXPORT_FPS);

    const h2cOpts = {
      scale: EXPORT_SCALE,
      width: w,
      height: h,
      useCORS: true,
      backgroundColor: null as string | null,
      logging: false,
    };

    const frames: HTMLCanvasElement[] = [];
    for (let f = 0; f <= totalFrames; f++) {
      const elapsed = (f / EXPORT_FPS) * 1000;
      setXAnimFrame(targets, elapsed);
      frames.push(await html2canvas(inner, h2cOpts));
      onProgress(
        `rendering ${f + 1}/${totalFrames + 1}…`,
        2 + Math.round((f / totalFrames) * 58),
      );
    }

    onProgress("encoding…", 62);
    const oc = document.createElement("canvas");
    oc.width = w;
    oc.height = h;
    const gfx = oc.getContext("2d");
    if (!gfx) throw new Error("2d context unavailable");

    const fmt = pickVideoRecorderFormat();
    const chunks: BlobPart[] = [];
    const rec = new MediaRecorder(oc.captureStream(EXPORT_FPS), {
      mimeType: fmt.mimeType,
      videoBitsPerSecond: 18_000_000,
    });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.start(250);

      const encodeStart = performance.now();
      let f = 0;

      const drawNext = () => {
        if (f >= frames.length) {
          rec.stop();
          return;
        }
        gfx.clearRect(0, 0, w, h);
        gfx.drawImage(frames[f], 0, 0, w, h);
        f++;
        onProgress(
          "encoding…",
          62 + Math.round((f / frames.length) * 34),
        );
        const nextAt = encodeStart + f * (1000 / EXPORT_FPS);
        const waitMs = Math.max(1, nextAt - performance.now());
        setTimeout(drawNext, waitMs);
      };
      drawNext();
    });

    const fileBase = `eyay-slide-${String(slideIndex + 1).padStart(2, "0")}`;
    dlURL(
      URL.createObjectURL(new Blob(chunks, { type: fmt.blobType })),
      `${fileBase}.${fmt.ext}`,
    );
    onProgress("done ✓", 100);
    onToast(`Slide video saved — 1080×1350 .${fmt.ext}`);
  } catch (e) {
    onToast(`Slide video failed: ${(e as Error).message}`);
    onProgress("", -1);
  } finally {
    root?.unmount();
    host.remove();
  }
}

export async function xTransition(
  slide: Slide,
  fromTheme: ThemeKey,
  toTheme: ThemeKey,
  slideIndex: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
  onProgress: ProgressFn,
  onToast: ToastFn,
): Promise<void> {
  const { w: W, h: H } = CAROUSEL_CAPTURE;
  onProgress("rendering…", 8);
  try {
    onProgress(`rendering ${fromTheme}…`, 18);
    const cA = await captureSlide(
      slide,
      fromTheme,
      slideIndex,
      totalSlides,
      globalStyle,
      CAROUSEL_CAPTURE,
    );
    onProgress(`rendering ${toTheme}…`, 38);
    const cB = await captureSlide(
      slide,
      toTheme,
      slideIndex,
      totalSlides,
      globalStyle,
      CAROUSEL_CAPTURE,
    );

    const oc = document.createElement("canvas");
    oc.width = W;
    oc.height = H;
    const g0 = oc.getContext("2d");
    if (!g0) throw new Error("2d context unavailable");
    const gfx: CanvasRenderingContext2D = g0;

    const FPS = 60;
    const DUR = 12.0;
    const FADE = 1.35;
    const HOLD = (DUR - FADE) / 2;

    const chunks: BlobPart[] = [];
    const fmt = pickVideoRecorderFormat();
    const rec = new MediaRecorder(oc.captureStream(FPS), {
      mimeType: fmt.mimeType,
      videoBitsPerSecond: 18_000_000,
    });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    onProgress("encoding…", 48);
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.start(250);

      let stopped = false;
      const start = performance.now();
      const stopAt = start + DUR * 1000;
      let intervalId: number | undefined;

      const stop = () => {
        if (stopped) return;
        stopped = true;
        if (intervalId !== undefined) window.clearInterval(intervalId);
        rec.stop();
      };

      const frameMs = Math.round(1000 / FPS);
      function render() {
        if (stopped) return;
        const tSec = (performance.now() - start) / 1000;

        gfx.clearRect(0, 0, W, H);
        gfx.globalAlpha = 1;
        gfx.drawImage(cA, 0, 0, W, H);

        if (tSec >= HOLD) {
          const tf = tSec - HOLD;
          const tRaw = Math.min(tf / FADE, 1);
          const alphaB = easeInOutSine(tRaw);
          gfx.globalAlpha = alphaB;
          gfx.drawImage(cB, 0, 0, W, H);
          gfx.globalAlpha = 1;
        }

        const tRatio = Math.min(Math.max(tSec / DUR, 0), 1);
        onProgress("encoding…", 48 + Math.round(tRatio * 48));

        if (performance.now() >= stopAt) stop();
      }

      render();
      intervalId = window.setInterval(render, frameMs);
      setTimeout(stop, Math.ceil(DUR * 1000) + 300);
    });

    const blob = new Blob(chunks, { type: fmt.blobType });
    const name = `eyay-${fromTheme}-to-${toTheme}.${fmt.ext}`;
    dlURL(URL.createObjectURL(blob), name);
    onProgress("done ✓", 100);
    onToast(
      `Transition saved — ${fromTheme}→${toTheme} · 1080×1350 .${fmt.ext}`,
    );
  } catch (e) {
    onToast(`Transition failed: ${(e as Error).message}`);
    onProgress("", -1);
  }
}

export async function encodeSlides(
  canvases: HTMLCanvasElement[],
  slideDur: number,
  fadeDur: number,
  fileBase: string,
  onProgress: ProgressFn,
  dimensions: CaptureDimensions = CAROUSEL_CAPTURE,
): Promise<{ ext: string }> {
  const { w: W, h: H } = dimensions;
  const oc = document.createElement("canvas");
  oc.width = W;
  oc.height = H;
  const g0 = oc.getContext("2d");
  if (!g0) throw new Error("2d context unavailable");
  const gfx: CanvasRenderingContext2D = g0;

  const FPS = 60;
  const sf = Math.ceil(slideDur * FPS);
  const ff = Math.ceil(fadeDur * FPS);
  const total = Math.ceil((slideDur * canvases.length + fadeDur) * FPS);
  const chunks: BlobPart[] = [];
  const fmt = pickVideoRecorderFormat();
  const rec = new MediaRecorder(oc.captureStream(FPS), {
    mimeType: fmt.mimeType,
    videoBitsPerSecond: 16_000_000,
  });
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  await new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
    rec.start(250);
    let f = 0;
    function tick() {
      const si = Math.min(Math.floor(f / sf), canvases.length - 1);
      const fi = f % sf;
      gfx.clearRect(0, 0, W, H);
      gfx.globalAlpha = 1;
      gfx.drawImage(canvases[si], 0, 0, W, H);
      if (si > 0 && fi < ff) {
        const t = fi / ff;
        const te = easeInOutSine(t);
        gfx.globalAlpha = 1 - te;
        gfx.drawImage(canvases[si - 1], 0, 0, W, H);
        gfx.globalAlpha = 1;
      }
      onProgress("encoding video…", 55 + Math.round((f / total) * 42));
      f++;
      if (f < total) requestAnimationFrame(tick);
      else rec.stop();
    }
    requestAnimationFrame(tick);
  });

  const filename = `${fileBase}.${fmt.ext}`;
  dlURL(
    URL.createObjectURL(new Blob(chunks, { type: fmt.blobType })),
    filename,
  );
  onProgress("done ✓", 100);
  return { ext: fmt.ext };
}

"use client";

import { createElement, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import DeckSlideRenderer from "@/components/DeckSlideRenderer";
import SlideRenderer from "@/components/SlideRenderer";
import {
  EASE_OUT,
  MOTION_REVEAL_MS,
  CHAT_ROW_REVEAL_MS,
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
 * Slide-video export: CSS-animation-seek engine.
 *
 * We apply the SAME CSS @keyframes used by the live preview —
 * paused — and "seek" to each frame time by adjusting
 * animation-delay.  The browser's CSS engine computes opacity,
 * transform, vertical-align, line-height, etc. natively.
 * html-to-image captures each frame via SVG foreignObject,
 * which uses the browser's own rendering engine (not a JS
 * re-implementation like html2canvas), so text layout, font
 * metrics, and vertical alignment are pixel-perfect.
 *
 * Typewriter text (terminal) is still JS-driven via textContent.
 * ================================================================ */

const EXPORT_FPS = 30;

const CHAT_SPEEDS = {
  normal: { f: 360, g: 640 },
  fast: { f: 220, g: 440 },
  slow: { f: 640, g: 980 },
} as const;

interface SeekTarget {
  el: HTMLElement;
  delay: number;
  dur: number;
}

interface TypewriterTarget {
  el: HTMLElement;
  fullText: string;
  startMs: number;
  charMs: number;
}

function setupExportTargets(
  root: HTMLElement,
  slide: Slide,
): { seek: SeekTarget[]; tw: TypewriterTarget | null } {
  const seek: SeekTarget[] = [];
  let tw: TypewriterTarget | null = null;

  const applyPausedAnim = (
    el: HTMLElement,
    keyframe: string,
    dur: number,
    delay: number,
  ) => {
    el.style.removeProperty("opacity");
    el.style.removeProperty("transform");
    el.style.animation =
      `${keyframe} ${dur}ms ${EASE_OUT} ${delay}ms both`;
    el.style.animationPlayState = "paused";
    seek.push({ el, delay, dur });
  };

  if (slide.layout === "chat") {
    const eyebrow = root.querySelector<HTMLElement>(
      ".s-eyebrow[data-animate]",
    );
    if (eyebrow) {
      applyPausedAnim(
        eyebrow,
        "s-motion-reveal",
        MOTION_REVEAL_MS,
        STAGGER_BASE_MS,
      );
    }

    const sp = CHAT_SPEEDS[slide.chatSpeed || "normal"];
    root.querySelectorAll<HTMLElement>("[data-bi]").forEach((el, i) => {
      applyPausedAnim(
        el,
        "s-chat-row-enter",
        CHAT_ROW_REVEAL_MS,
        sp.f + i * sp.g,
      );
    });
  } else if (slide.layout === "terminal") {
    const staggerEls = root.querySelectorAll<HTMLElement>("[data-animate]");
    staggerEls.forEach((el, i) => {
      applyPausedAnim(
        el,
        "s-motion-reveal",
        MOTION_REVEAL_MS,
        STAGGER_BASE_MS + i * STAGGER_STEP_MS,
      );
    });

    const textEl = root.querySelector<HTMLElement>(".s-tcmd-text");
    if (textEl) {
      const full = textEl.textContent || "";
      const hasEyebrow = Boolean(slide.eyebrow?.trim());
      const startMs =
        STAGGER_BASE_MS + (hasEyebrow ? STAGGER_STEP_MS : 0) + 480;
      tw = { el: textEl, fullText: full, startMs, charMs: TYPEWRITER_CHAR_MS };
      textEl.textContent = "";
    }
  } else {
    root.querySelectorAll<HTMLElement>("[data-animate]").forEach((el, i) => {
      applyPausedAnim(
        el,
        "s-motion-reveal",
        MOTION_REVEAL_MS,
        STAGGER_BASE_MS + i * STAGGER_STEP_MS,
      );
    });
  }

  root.querySelectorAll<HTMLElement>(".s-tcur").forEach((el) => {
    el.style.animation = "none";
    el.style.opacity = "1";
  });

  return { seek, tw };
}

function seekFrame(
  seek: SeekTarget[],
  tw: TypewriterTarget | null,
  ms: number,
) {
  for (const t of seek) {
    t.el.style.animationDelay = `${t.delay - ms}ms`;
  }

  if (tw) {
    const elapsed = ms - tw.startMs;
    if (elapsed <= 0) {
      tw.el.textContent = "";
    } else {
      const n = Math.min(
        tw.fullText.length,
        Math.floor(elapsed / tw.charMs) + 1,
      );
      tw.el.textContent = tw.fullText.slice(0, n);
    }
  }
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
    "video/mp4;codecs=avc1.640033",
    "video/mp4;codecs=avc1.640028",
    "video/mp4;codecs=avc1.4D0033",
    "video/mp4;codecs=avc1.4D0028",
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
  host.style.cssText = `position:absolute;left:-99999px;top:0;width:${w}px;height:${h}px;overflow:hidden;pointer-events:none;z-index:-1;`;
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
    x: 0,
    y: 0,
    scrollX: 0,
    scrollY: 0,
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

function finalizeAnimatedEls(container: HTMLElement) {
  container.querySelectorAll<HTMLElement>("[data-animate]").forEach((el) => {
    const cs = getComputedStyle(el);
    el.style.opacity = cs.opacity;
    el.style.transform = cs.transform;
    el.style.animation = "none";
  });
}

/**
 * Animated slide video — two-phase pipeline:
 *   Phase 1  Pre-render every frame into an ImageBitmap buffer.
 *   Phase 2  Encode from buffer via WebCodecs (→ mp4) or MediaRecorder fallback.
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
  host.style.cssText = `position:absolute;left:-99999px;top:0;width:${w}px;height:${h}px;overflow:hidden;pointer-events:none;z-index:-1;`;
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

    const { seek, tw } = setupExportTargets(inner, slide);
    finalizeAnimatedEls(inner);
    void inner.offsetHeight;

    let animEndMs = seek.reduce(
      (max, t) => Math.max(max, t.delay + t.dur),
      0,
    );
    if (tw) {
      animEndMs = Math.max(
        animEndMs,
        tw.startMs + tw.fullText.length * tw.charMs,
      );
    }
    const holdMs = 1500;
    const totalMs = Math.max(2400, animEndMs + holdMs);
    const totalFrames = Math.ceil((totalMs / 1000) * EXPORT_FPS);

    const h2cOpts = {
      scale: 1,
      width: w,
      height: h,
      useCORS: true,
      backgroundColor: null as string | null,
      logging: false,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
    };

    // Phase 1 — Pre-render all frames into an ImageBitmap buffer
    const bitmaps: ImageBitmap[] = [];
    for (let f = 0; f <= totalFrames; f++) {
      const elapsed = (f / EXPORT_FPS) * 1000;
      seekFrame(seek, tw, elapsed);
      void inner.offsetHeight;
      await doubleRaf();

      const canvas = await html2canvas(inner, h2cOpts);
      const bm = await createImageBitmap(canvas);
      bitmaps.push(bm);
      onProgress(
        `rendering ${f + 1}/${totalFrames + 1}…`,
        2 + Math.round((f / totalFrames) * 58),
      );
    }

    // Phase 2 — Encode from buffer
    onProgress("encoding…", 62);

    if (typeof VideoEncoder !== "undefined") {
      const { Muxer, ArrayBufferTarget } = await import("mp4-muxer");
      const target = new ArrayBufferTarget();
      const muxer = new Muxer({
        target,
        video: { codec: "avc", width: w, height: h },
        fastStart: "in-memory",
      });

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => { throw e; },
      });
      encoder.configure({
        // High @ L5.1 — higher than L4.0 for large frames / future resolutions; avoids AVC level errors.
        codec: "avc1.640033",
        width: w,
        height: h,
        bitrate: 18_000_000,
        framerate: EXPORT_FPS,
      });

      for (let f = 0; f < bitmaps.length; f++) {
        const frame = new VideoFrame(bitmaps[f], {
          timestamp: Math.round((f / EXPORT_FPS) * 1_000_000),
        });
        encoder.encode(frame, { keyFrame: f % 30 === 0 });
        frame.close();
        bitmaps[f].close();
        onProgress("encoding…", 62 + Math.round((f / bitmaps.length) * 34));
      }

      await encoder.flush();
      muxer.finalize();

      const blob = new Blob(
        [target.buffer],
        { type: "video/mp4" },
      );
      dlURL(
        URL.createObjectURL(blob),
        `eyay-slide-${String(slideIndex + 1).padStart(2, "0")}.mp4`,
      );
      onProgress("done ✓", 100);
      onToast("Slide video saved — 1080×1350 .mp4");
    } else {
      const oc = document.createElement("canvas");
      oc.width = w;
      oc.height = h;
      const gfx = oc.getContext("2d")!;
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
        let f = 0;
        const encodeStart = performance.now();

        const drawNext = () => {
          if (f >= bitmaps.length) {
            rec.stop();
            return;
          }
          gfx.clearRect(0, 0, w, h);
          gfx.drawImage(bitmaps[f], 0, 0, w, h);
          bitmaps[f].close();
          f++;
          onProgress("encoding…", 62 + Math.round((f / bitmaps.length) * 34));
          const nextAt = encodeStart + f * (1000 / EXPORT_FPS);
          const waitMs = Math.max(1, nextAt - performance.now());
          setTimeout(drawNext, waitMs);
        };
        drawNext();
      });

      const fmt2 = pickVideoRecorderFormat();
      dlURL(
        URL.createObjectURL(new Blob(chunks, { type: fmt2.blobType })),
        `eyay-slide-${String(slideIndex + 1).padStart(2, "0")}.${fmt2.ext}`,
      );
      onProgress("done ✓", 100);
      onToast(`Slide video saved — 1080×1350 .${fmt2.ext}`);
    }
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

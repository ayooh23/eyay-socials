"use client";

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas";
import SlideRenderer from "@/components/SlideRenderer";
import type { GlobalStyle, Slide, ThemeKey } from "@/lib/types";

/** Pass pct &lt; 0 to hide the progress bar immediately (export errors). */
export type ProgressFn = (label: string, pct: number) => void;
export type ToastFn = (message: string) => void;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
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
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/** Prefer H.264 MP4 (editing-friendly); fall back to WebM where MP4 recording is unsupported. */
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

export async function captureSlide(
  slide: Slide,
  themeKey: ThemeKey,
  slideIndex: number,
  totalSlides: number,
  globalStyle: GlobalStyle,
): Promise<HTMLCanvasElement> {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-99999px;top:-99999px;width:1080px;height:1350px;overflow:hidden;pointer-events:none;z-index:-1;";
  const inner = document.createElement("div");
  inner.style.cssText =
    "position:relative;width:1080px;height:1350px;overflow:hidden;font-family:var(--sans, 'DM Sans', system-ui, sans-serif);";
  host.appendChild(inner);
  document.body.appendChild(host);

  const root = createRoot(inner);
  root.render(
    createElement(SlideRenderer, {
      slide,
      themeKey,
      globalStyle,
      slideIndex,
      totalSlides,
      staticChat: true,
    }),
  );

  await sleep(90);

  const canvas = await html2canvas(inner, {
    scale: 1,
    width: 1080,
    height: 1350,
    useCORS: true,
    backgroundColor: null,
    logging: false,
  });

  root.unmount();
  document.body.removeChild(host);

  return canvas;
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
      );
      frames.push(c.toDataURL("image/png"));
    }
    onProgress("encoding GIF…", 80);
    await new Promise<void>((res, rej) => {
      gifshot.createGIF(
        {
          images: frames,
          gifWidth: 1080,
          gifHeight: 1350,
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
        ),
      );
    }
    const { ext } = await encodeSlides(
      cs,
      2.4,
      0.32,
      "eyay-carousel",
      onProgress,
    );
    onToast(`Video saved — 1080×1350 .${ext}`);
  } catch (e) {
    onToast(`Video failed: ${(e as Error).message}`);
    onProgress("", -1);
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
  onProgress("rendering…", 8);
  try {
    onProgress(`rendering ${fromTheme}…`, 18);
    const cA = await captureSlide(
      slide,
      fromTheme,
      slideIndex,
      totalSlides,
      globalStyle,
    );
    onProgress(`rendering ${toTheme}…`, 38);
    const cB = await captureSlide(
      slide,
      toTheme,
      slideIndex,
      totalSlides,
      globalStyle,
    );

    const oc = document.createElement("canvas");
    oc.width = 1080;
    oc.height = 1350;
    const g0 = oc.getContext("2d");
    if (!g0) throw new Error("2d context unavailable");
    const gfx: CanvasRenderingContext2D = g0;

    const FPS = 30;
    const DUR = 3.0;
    const HOLD = 0.65;
    const FADE = 1.7;
    const totalF = Math.ceil(DUR * FPS);
    const holdF = Math.ceil(HOLD * FPS);
    const fadeF = Math.ceil(FADE * FPS);

    const chunks: BlobPart[] = [];
    const fmt = pickVideoRecorderFormat();
    const rec = new MediaRecorder(oc.captureStream(FPS), {
      mimeType: fmt.mimeType,
      videoBitsPerSecond: 14_000_000,
    });
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    onProgress("encoding…", 48);
    await new Promise<void>((resolve) => {
      rec.onstop = () => resolve();
      rec.start();
      let f = 0;
      function tick() {
        gfx.clearRect(0, 0, 1080, 1350);
        if (f < holdF) {
          gfx.globalAlpha = 1;
          gfx.drawImage(cA, 0, 0, 1080, 1350);
        } else {
          const tf = f - holdF;
          const tRaw = Math.min(tf / fadeF, 1);
          const te =
            tRaw < 0.5 ? 2 * tRaw * tRaw : -1 + (4 - 2 * tRaw) * tRaw;
          gfx.globalAlpha = 1;
          gfx.drawImage(cA, 0, 0, 1080, 1350);
          gfx.globalAlpha = te;
          gfx.drawImage(cB, 0, 0, 1080, 1350);
          gfx.globalAlpha = 1;
        }
        onProgress("encoding…", 48 + Math.round((f / totalF) * 48));
        f++;
        if (f < totalF) requestAnimationFrame(tick);
        else rec.stop();
      }
      requestAnimationFrame(tick);
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
): Promise<{ ext: string }> {
  const oc = document.createElement("canvas");
  oc.width = 1080;
  oc.height = 1350;
  const g0 = oc.getContext("2d");
  if (!g0) throw new Error("2d context unavailable");
  const gfx: CanvasRenderingContext2D = g0;

  const FPS = 30;
  const sf = Math.ceil(slideDur * FPS);
  const ff = Math.ceil(fadeDur * FPS);
  const total = Math.ceil((slideDur * canvases.length + fadeDur) * FPS);
  const chunks: BlobPart[] = [];
  const fmt = pickVideoRecorderFormat();
  const rec = new MediaRecorder(oc.captureStream(FPS), {
    mimeType: fmt.mimeType,
    videoBitsPerSecond: 12_000_000,
  });
  rec.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  await new Promise<void>((resolve) => {
    rec.onstop = () => resolve();
    rec.start();
    let f = 0;
    function tick() {
      const si = Math.min(Math.floor(f / sf), canvases.length - 1);
      const fi = f % sf;
      gfx.clearRect(0, 0, 1080, 1350);
      gfx.globalAlpha = 1;
      gfx.drawImage(canvases[si], 0, 0, 1080, 1350);
      if (si > 0 && fi < ff) {
        const t = fi / ff;
        const te = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        gfx.globalAlpha = 1 - te;
        gfx.drawImage(canvases[si - 1], 0, 0, 1080, 1350);
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

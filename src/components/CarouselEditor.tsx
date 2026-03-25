"use client";

import { useCallback, useRef, useState } from "react";
import CarouselTab, { type CarouselHeaderApi } from "@/components/tabs/CarouselTab";
import { MainTabBar, type MainTab } from "@/components/tabs/index";
import DocsTab from "@/components/tabs/DocsTab";
import ProposalsTab from "@/components/tabs/ProposalsTab";
import SlidesTab, { type SlidesHeaderApi } from "@/components/tabs/SlidesTab";

export default function CarouselEditor() {
  const [mainTab, setMainTab] = useState<MainTab>("carousel");
  const carouselHeaderApi = useRef<CarouselHeaderApi | null>(null);
  const slidesHeaderApi = useRef<SlidesHeaderApi | null>(null);
  const pdfExportRef = useRef<(() => void) | null>(null);

  const [progShow, setProgShow] = useState(false);
  const [progLabel, setProgLabel] = useState("rendering…");
  const [progPct, setProgPct] = useState(0);

  const [toastShow, setToastShow] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onProgress = useCallback((label: string, pct: number) => {
    if (pct < 0) {
      setProgShow(false);
      return;
    }
    setProgShow(true);
    setProgLabel(label);
    setProgPct(pct);
    if (pct >= 100) {
      setTimeout(() => setProgShow(false), 1400);
    }
  }, []);

  const onToast = useCallback((m: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMsg(m);
    setToastShow(true);
    toastTimer.current = setTimeout(() => setToastShow(false), 2800);
  }, []);

  const progressFooter = (
    <div className={`prog ${progShow ? "show" : ""}`}>
      <span>{progLabel}</span>
      <div className="prog-tr">
        <div className="prog-fi" style={{ width: `${progPct}%` }} />
      </div>
      <span>{progPct}%</span>
    </div>
  );

  const logoSubtitle =
    mainTab === "carousel"
      ? "carousel generator"
      : mainTab === "slides"
        ? "slides generator"
        : mainTab === "proposals"
          ? "proposals"
          : "docs";

  return (
    <div className="eyay-root">
      <header>
        <div style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
          <div className="logo">
            <b>eyay</b>
            <em>·</em>
            {logoSubtitle}
          </div>
          <MainTabBar value={mainTab} onChange={setMainTab} />
        </div>
        {mainTab === "carousel" ? (
          <div className="header-r">
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: "var(--text3)",
                letterSpacing: "0.06em",
              }}
            >
              1080 × 1350
            </span>
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={() => carouselHeaderApi.current?.resetAll()}
            >
              ↺ reset
            </button>
            <button
              type="button"
              className="btn btn-p btn-sm"
              onClick={() => carouselHeaderApi.current?.addSlide()}
            >
              + slide
            </button>
          </div>
        ) : mainTab === "slides" ? (
          <div className="header-r">
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: "var(--text3)",
                letterSpacing: "0.06em",
              }}
            >
              1920 × 1080
            </span>
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={() => slidesHeaderApi.current?.resetAll()}
            >
              ↺ reset
            </button>
            <button
              type="button"
              className="btn btn-p btn-sm"
              onClick={() => slidesHeaderApi.current?.addSlide()}
            >
              + slide
            </button>
          </div>
        ) : mainTab === "proposals" || mainTab === "docs" ? (
          <div className="header-r">
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 9,
                color: "var(--text3)",
                letterSpacing: "0.06em",
              }}
            >
              A4 · 794 × 1123
            </span>
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={() => pdfExportRef.current?.()}
            >
              Export PDF
            </button>
          </div>
        ) : null}
      </header>

      {mainTab === "carousel" ? (
        <CarouselTab
          headerApiRef={carouselHeaderApi}
          onProgress={onProgress}
          onToast={onToast}
          progressFooter={progressFooter}
        />
      ) : mainTab === "slides" ? (
        <SlidesTab
          headerApiRef={slidesHeaderApi}
          onProgress={onProgress}
          onToast={onToast}
          progressFooter={progressFooter}
        />
      ) : mainTab === "proposals" ? (
        <ProposalsTab
          onProgress={onProgress}
          onToast={onToast}
          progressFooter={progressFooter}
          pdfExportRef={pdfExportRef}
        />
      ) : (
        <DocsTab
          onProgress={onProgress}
          onToast={onToast}
          progressFooter={progressFooter}
          pdfExportRef={pdfExportRef}
        />
      )}

      <div id="toast" className={toastShow ? "show" : ""}>
        {toastMsg}
      </div>
    </div>
  );
}

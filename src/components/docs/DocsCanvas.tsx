"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { DocPage } from "@/lib/docPages";
import DocAboutEyaPage from "./DocAboutEyaPage";
import DocBodyPage from "./DocBodyPage";
import DocCoverPage from "./DocCoverPage";

export interface DocsCanvasProps {
  pages: DocPage[];
}

const PAGE_W = 794;
const PAGE_H = 1123;
const VIEWPORT_H_PAD = 160;
const SCALE_MAX = 2.5;
const SCALE_MIN = 0.12;

export default function DocsCanvas({ pages }: DocsCanvasProps) {
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const compute = () => {
      const maxH = Math.max(120, window.innerHeight - VIEWPORT_H_PAD);
      const maxW = Math.max(120, el.clientWidth);
      const s = Math.min(maxH / PAGE_H, maxW / PAGE_W);
      setScale(Math.min(SCALE_MAX, Math.max(SCALE_MIN, s)));
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  const totalPages = pages.length;

  return (
    <div ref={wrapRef} className="proposal-preview-wrap doc-preview-wrap">
      {pages.map((page, i) => (
        <div
          key={page.key}
          className="proposal-page-frame"
          style={{
            position: "relative",
            width: PAGE_W * scale,
            height: PAGE_H * scale,
          }}
        >
          <div
            className="proposal-scale-inner"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {page.kind === "cover" ? (
              <DocCoverPage
                cover={page.cover}
                pageIndex={i}
                totalPages={totalPages}
              />
            ) : null}
            {page.kind === "body" ? (
              <DocBodyPage
                sectionTitle={page.sectionTitle}
                continuation={page.continuation}
                body={page.body}
                pageIndex={i}
                totalPages={totalPages}
              />
            ) : null}
            {page.kind === "about-eya" ? (
              <DocAboutEyaPage
                continuation={page.continuation}
                showHeadline={page.showHeadline}
                headline={page.headline}
                paragraphs={page.paragraphs}
                pageIndex={i}
                totalPages={totalPages}
              />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

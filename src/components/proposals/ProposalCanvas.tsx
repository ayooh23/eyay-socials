"use client";

import { useEffect, useRef, useState } from "react";
import type { Proposal, ProposalPageModel } from "@/lib/proposalTypes";
import ProposalRenderer from "./ProposalRenderer";

export interface ProposalCanvasProps {
  proposal: Proposal;
  pages: ProposalPageModel[];
  scrollToPageIndex: number | null;
  onScrollHandled: () => void;
}

export default function ProposalCanvas({
  proposal,
  pages,
  scrollToPageIndex,
  onScrollHandled,
}: ProposalCanvasProps) {
  const [scale, setScale] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ro = () => {
      const PREVIEW_MAX_H = window.innerHeight - 160;
      setScale(Math.min(PREVIEW_MAX_H / 1123, 1));
    };
    ro();
    window.addEventListener("resize", ro);
    return () => window.removeEventListener("resize", ro);
  }, []);

  useEffect(() => {
    if (scrollToPageIndex == null) return;
    const el = pageRefs.current[scrollToPageIndex];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    onScrollHandled();
  }, [scrollToPageIndex, onScrollHandled, pages.length]);

  return (
    <div ref={wrapRef} className="proposal-preview-wrap">
      {pages.map((page, i) => (
        <div
          key={page.key}
          ref={(el) => {
            pageRefs.current[i] = el;
          }}
          className="proposal-page-frame"
          style={{
            position: "relative",
            width: 794 * scale,
            height: 1123 * scale,
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
            <ProposalRenderer
              proposal={proposal}
              page={page}
              pageIndex={i}
              totalPages={pages.length}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

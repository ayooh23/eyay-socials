"use client";

import DocMarkdownWeb from "@/components/docs/DocMarkdownWeb";
import { DOC_ABOUT_EYA_TITLE } from "@/lib/docPages";
import {
  DOC_TEXT_PAD_BOTTOM,
  DOC_TEXT_PAD_TOP,
  DOC_TEXT_PAD_X,
} from "@/lib/docPageLayout";
import { PROPOSAL_PRICING_OPTIONS_THEME } from "@/lib/proposalThemes";

const W = 794;
const H = 1123;

export interface DocAboutEyaPageProps {
  continuation: boolean;
  showHeadline: boolean;
  headline: string;
  paragraphs: string[];
  pageIndex: number;
  totalPages: number;
}

export default function DocAboutEyaPage({
  continuation,
  showHeadline,
  headline,
  paragraphs,
  pageIndex,
  totalPages,
}: DocAboutEyaPageProps) {
  const pt = PROPOSAL_PRICING_OPTIONS_THEME;
  const sans = "var(--font-dm-sans), system-ui, sans-serif";
  const mono = "var(--font-dm-mono), ui-monospace, monospace";
  const pageNum = pageIndex + 1;

  return (
    <div
      data-proposal-page
      style={{
        width: W,
        height: H,
        background: pt.bg,
        color: pt.text,
        position: "relative",
        boxSizing: "border-box",
        paddingTop: DOC_TEXT_PAD_TOP,
        paddingLeft: DOC_TEXT_PAD_X,
        paddingRight: DOC_TEXT_PAD_X,
        paddingBottom: DOC_TEXT_PAD_BOTTOM,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <h2
        style={{
          width: "100%",
          fontFamily: sans,
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: 0,
          lineHeight: 1.15,
          color: pt.text,
        }}
      >
        {DOC_ABOUT_EYA_TITLE}
        {continuation ? (
          <span style={{ color: pt.muted, fontWeight: 400, fontSize: 14 }}>
            {" "}
            (cont.)
          </span>
        ) : null}
      </h2>
      <div
        style={{
          width: 40,
          height: 4,
          background: pt.accent,
          marginTop: 8,
        }}
      />
      <div style={{ height: 24 }} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          className="doc-md-scroll"
          style={{
            flex: 1,
            width: "100%",
            minWidth: 0,
            maxHeight: "100%",
            overflow: "auto",
            fontFamily: sans,
            color: pt.text,
          }}
        >
          {showHeadline && headline.trim() ? (
            <div style={{ marginBottom: 14 }}>
              <DocMarkdownWeb
                source={headline}
                variant="aboutEya"
                density="headline"
              />
            </div>
          ) : null}
          {paragraphs.map((p, i) => (
            <div key={`${i}-${p.slice(0, 16)}`} style={{ marginBottom: 14 }}>
              <DocMarkdownWeb source={p} variant="aboutEya" />
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: DOC_TEXT_PAD_X,
          right: DOC_TEXT_PAD_X,
          fontFamily: mono,
          fontSize: 10,
          color: pt.text,
          opacity: 0.35,
        }}
      >
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

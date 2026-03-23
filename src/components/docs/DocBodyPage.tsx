"use client";

import DocMarkdownWeb from "@/components/docs/DocMarkdownWeb";
import {
  DOC_TEXT_PAD_BOTTOM,
  DOC_TEXT_PAD_TOP,
  DOC_TEXT_PAD_X,
} from "@/lib/docPageLayout";
import { PROPOSAL_THEMES } from "@/lib/proposalThemes";

const W = 794;
const H = 1123;

export interface DocBodyPageProps {
  sectionTitle: string;
  continuation: boolean;
  body: string;
  pageIndex: number;
  totalPages: number;
}

export default function DocBodyPage({
  sectionTitle,
  continuation,
  body,
  pageIndex,
  totalPages,
}: DocBodyPageProps) {
  const pt = PROPOSAL_THEMES.light;
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
        {sectionTitle.trim() || "Document"}
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
          <DocMarkdownWeb source={body} variant="light" />
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
          opacity: 0.3,
        }}
      >
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

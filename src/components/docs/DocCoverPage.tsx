"use client";

import type { DocCoverModel } from "@/lib/docPages";
import { PROPOSAL_COVER_STYLES } from "@/lib/proposalThemes";

const W = 794;
const H = 1123;
const M = 60;

const COVER = PROPOSAL_COVER_STYLES;

function fmtDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export interface DocCoverPageProps {
  cover: DocCoverModel;
  pageIndex: number;
  totalPages: number;
}

export default function DocCoverPage({
  cover,
  pageIndex,
  totalPages,
}: DocCoverPageProps) {
  const mono = "var(--font-dm-mono), ui-monospace, monospace";
  const sans = "var(--font-dm-sans), system-ui, sans-serif";
  const pageNum = pageIndex + 1;
  const meta = cover;

  return (
    <div
      data-proposal-page
      style={{
        width: W,
        height: H,
        background: COVER.bg,
        color: COVER.text,
        position: "relative",
        boxSizing: "border-box",
        padding: M,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontFamily: mono,
          fontSize: 10,
          color: COVER.muted,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        <span>eyay.studio</span>
        <span>{meta.docNumber.trim() || "—"}</span>
      </div>
      <div
        style={{
          height: 2,
          background: COVER.rule,
          marginTop: 12,
          width: "100%",
        }}
      />
      <div style={{ height: 48 }} />
      <h1
        style={{
          fontFamily: sans,
          fontSize: 48,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          margin: 0,
          color: COVER.text,
        }}
      >
        {meta.projectName.trim() || "Document"}
      </h1>
      <div
        style={{
          marginTop: 12,
          fontFamily: mono,
          fontSize: 12,
          fontWeight: 400,
          color: COVER.muted,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {meta.clientName.trim() || "—"}
      </div>
      <div style={{ height: 48 }} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "14px 28px",
          fontFamily: mono,
          fontSize: 10,
          color: COVER.muted,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <div>
          <div style={{ opacity: 0.85, marginBottom: 4 }}>Prepared by</div>
          <div
            style={{
              color: COVER.text,
              textTransform: "none",
              letterSpacing: "0.04em",
            }}
          >
            {meta.preparedBy || "eyay studio"}
          </div>
        </div>
        <div>
          <div style={{ opacity: 0.85, marginBottom: 4 }}>Prepared for</div>
          <div
            style={{
              color: COVER.text,
              textTransform: "none",
              letterSpacing: "0.04em",
            }}
          >
            {meta.clientName.trim() || "—"}
          </div>
        </div>
        <div>
          <div style={{ opacity: 0.85, marginBottom: 4 }}>Date</div>
          <div style={{ color: COVER.text }}>{fmtDate(meta.proposalDate)}</div>
        </div>
        <div>
          <div style={{ opacity: 0.85, marginBottom: 4 }}>Type</div>
          <div
            style={{
              color: COVER.text,
              textTransform: "none",
              letterSpacing: "0.04em",
            }}
          >
            {meta.docType.trim() || "—"}
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          color: COVER.footer,
          letterSpacing: "0.06em",
        }}
      >
        {meta.studioEmail}
        <br />
        {meta.studioAddress}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: M,
          right: M,
          fontFamily: mono,
          fontSize: 10,
          color: COVER.text,
          opacity: 0.3,
        }}
      >
        {pageNum} / {totalPages}
      </div>
    </div>
  );
}

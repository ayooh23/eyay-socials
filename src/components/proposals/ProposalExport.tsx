"use client";

import type { Proposal } from "@/lib/proposalTypes";
import { exportProposalPDF } from "@/lib/proposalExport";

export type ProposalProgressFn = (label: string, pct: number) => void;
export type ProposalToastFn = (msg: string) => void;

export interface ProposalExportProps {
  proposal: Proposal;
  onProgress: ProposalProgressFn;
  onToast: ProposalToastFn;
}

export default function ProposalExport({
  proposal,
  onProgress,
  onToast,
}: ProposalExportProps) {
  const run = async () => {
    onProgress("building PDF…", 5);
    try {
      await exportProposalPDF(proposal);
      onProgress("done", 100);
      onToast("PDF downloaded");
    } catch (e) {
      onProgress("", -1);
      onToast("Export failed");
      console.error(e);
    }
  };

  return (
    <div className="xbar">
      <span className="xlabel">export</span>
      <button type="button" className="btn btn-p btn-sm" onClick={run}>
        ↓ PDF
      </button>
    </div>
  );
}

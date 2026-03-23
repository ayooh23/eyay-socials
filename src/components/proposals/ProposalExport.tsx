"use client";

import type { Proposal } from "@/lib/proposalTypes";
import { exportProposalTextPDF } from "@/lib/proposalTextExport";

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
  const runText = async () => {
    onProgress("building text PDF…", 5);
    try {
      await exportProposalTextPDF(proposal);
      onProgress("done", 100);
      onToast("Text PDF (A4) downloaded");
    } catch (e) {
      onProgress("", -1);
      onToast("Export failed");
      console.error(e);
    }
  };

  return (
    <div className="xbar">
      <span className="xlabel">export</span>
      <button type="button" className="btn btn-g btn-sm" onClick={runText}>
        Export PDF (text A4)
      </button>
    </div>
  );
}

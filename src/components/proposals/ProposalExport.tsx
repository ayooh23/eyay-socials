"use client";

import type { Proposal } from "@/lib/proposalTypes";
import { exportProposalTextPDF } from "@/lib/proposalTextExport";

export type ProposalProgressFn = (label: string, pct: number) => void;
export type ProposalToastFn = (msg: string) => void;

export async function runProposalTextPdfExport(
  proposal: Proposal,
  onProgress: ProposalProgressFn,
  onToast: ProposalToastFn,
): Promise<void> {
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
}

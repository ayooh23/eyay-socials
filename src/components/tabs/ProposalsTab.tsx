"use client";

import type { MutableRefObject, ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import ProposalCanvas from "@/components/proposals/ProposalCanvas";
import ProposalEditor from "@/components/proposals/ProposalEditor";
import {
  runProposalTextPdfExport,
  type ProposalProgressFn,
  type ProposalToastFn,
} from "@/components/proposals/ProposalExport";
import { useProposal } from "@/hooks/useProposal";

export interface ProposalsTabProps {
  onProgress: ProposalProgressFn;
  onToast: ProposalToastFn;
  progressFooter: ReactNode;
  pdfExportRef: MutableRefObject<(() => void) | null>;
}

export default function ProposalsTab({
  onProgress,
  onToast,
  progressFooter,
  pdfExportRef,
}: ProposalsTabProps) {
  const {
    hydrated,
    proposals,
    activeId,
    activeProposal,
    pages,
    selectProposal,
    addProposal,
    deleteProposal,
    patchMeta,
    setTheme,
    toggleSection,
    moveSection,
    updateActive,
  } = useProposal();

  const [scrollToPageIndex, setScrollToPageIndex] = useState<number | null>(
    null,
  );

  const handleScrollHandled = useCallback(() => {
    setScrollToPageIndex(null);
  }, []);

  const runExport = useCallback(() => {
    if (!activeProposal) return;
    void runProposalTextPdfExport(activeProposal, onProgress, onToast);
  }, [activeProposal, onProgress, onToast]);

  useEffect(() => {
    if (!hydrated || !activeProposal) {
      pdfExportRef.current = null;
      return;
    }
    pdfExportRef.current = runExport;
    return () => {
      pdfExportRef.current = null;
    };
  }, [hydrated, activeProposal, pdfExportRef, runExport]);

  if (!hydrated || !activeProposal) {
    return (
      <>
        <aside />
        <main>
          <div className="cwrap" style={{ color: "var(--text3)", fontSize: 12 }}>
            Loading…
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <aside>
        <ProposalEditor
          proposal={activeProposal}
          proposals={proposals}
          activeId={activeId}
          onSelectProposal={selectProposal}
          onAddProposal={addProposal}
          onDeleteProposal={deleteProposal}
          patchMeta={patchMeta}
          setTheme={setTheme}
          toggleSection={toggleSection}
          moveSection={moveSection}
          updateActive={updateActive}
          onJumpToPage={(i) => setScrollToPageIndex(i)}
        />
      </aside>

      <main>
        <div className="cwrap">
          <ProposalCanvas
            proposal={activeProposal}
            pages={pages}
            scrollToPageIndex={scrollToPageIndex}
            onScrollHandled={handleScrollHandled}
          />

          {progressFooter}
        </div>
      </main>
    </>
  );
}

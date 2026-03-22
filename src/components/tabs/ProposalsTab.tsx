"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";
import ProposalCanvas from "@/components/proposals/ProposalCanvas";
import ProposalEditor from "@/components/proposals/ProposalEditor";
import ProposalExport from "@/components/proposals/ProposalExport";
import { useProposal } from "@/hooks/useProposal";
import type { ProposalProgressFn, ProposalToastFn } from "@/components/proposals/ProposalExport";

export interface ProposalsTabProps {
  onProgress: ProposalProgressFn;
  onToast: ProposalToastFn;
  progressFooter: ReactNode;
}

export default function ProposalsTab({
  onProgress,
  onToast,
  progressFooter,
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
          <ProposalExport
            proposal={activeProposal}
            onProgress={onProgress}
            onToast={onToast}
          />

          {progressFooter}
        </div>
      </main>
    </>
  );
}

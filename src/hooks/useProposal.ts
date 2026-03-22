"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createDefaultProposal, mergeLoadedProposal } from "@/lib/proposalDefaults";
import { buildProposalPages } from "@/lib/proposalPaginate";
import type {
  Proposal,
  ProposalTheme,
  ProposalsStorageState,
  SectionType,
} from "@/lib/proposalTypes";

const STORAGE_KEY = "eyay-proposals-state";

export function useProposal() {
  const [hydrated, setHydrated] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as ProposalsStorageState;
        if (Array.isArray(p.proposals) && p.proposals.length > 0) {
          const normalised = p.proposals.map((raw) => mergeLoadedProposal(raw));
          setProposals(normalised);
          const aid =
            p.activeId && p.proposals.some((x) => x.id === p.activeId)
              ? p.activeId
              : p.proposals[0]!.id;
          setActiveId(aid);
          setHydrated(true);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    const first = createDefaultProposal();
    setProposals([first]);
    setActiveId(first.id);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const t = setTimeout(() => {
      const payload: ProposalsStorageState = { proposals, activeId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }, 500);
    return () => clearTimeout(t);
  }, [proposals, activeId, hydrated]);

  const activeProposal = useMemo(
    () => proposals.find((p) => p.id === activeId),
    [proposals, activeId],
  );

  const pages = useMemo(
    () => (activeProposal ? buildProposalPages(activeProposal) : []),
    [activeProposal],
  );

  const updateActive = useCallback(
    (fn: (p: Proposal) => Proposal) => {
      setProposals((prev) =>
        prev.map((p) => (p.id === activeId ? fn(p) : p)),
      );
    },
    [activeId],
  );

  const addProposal = useCallback(() => {
    const next = createDefaultProposal();
    setProposals((prev) => [...prev, next]);
    setActiveId(next.id);
  }, []);

  const deleteProposal = useCallback((id: string) => {
    setProposals((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  useEffect(() => {
    if (!hydrated || proposals.length === 0) return;
    if (!proposals.some((p) => p.id === activeId)) {
      setActiveId(proposals[0]!.id);
    }
  }, [proposals, activeId, hydrated]);

  const selectProposal = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const setTheme = useCallback(
    (theme: ProposalTheme) => {
      updateActive((p) => ({ ...p, theme }));
    },
    [updateActive],
  );

  const patchMeta = useCallback(
    (patch: Partial<Proposal["meta"]>) => {
      updateActive((p) => ({ ...p, meta: { ...p.meta, ...patch } }));
    },
    [updateActive],
  );

  const toggleSection = useCallback(
    (type: SectionType) => {
      if (type === "cover") return;
      updateActive((p) => ({
        ...p,
        sections: p.sections.map((s) =>
          s.type === type ? { ...s, enabled: !s.enabled } : s,
        ),
      }));
    },
    [updateActive],
  );

  const moveSection = useCallback(
    (type: SectionType, dir: -1 | 1) => {
      if (type === "cover") return;
      updateActive((p) => {
        const sorted = [...p.sections].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((s) => s.type === type);
        if (idx < 1) return p;
        const ni = idx + dir;
        if (ni < 1 || ni >= sorted.length) return p;
        const a = sorted[idx]!;
        const b = sorted[ni]!;
        return {
          ...p,
          sections: p.sections.map((s) => {
            if (s.id === a.id) return { ...s, order: b.order };
            if (s.id === b.id) return { ...s, order: a.order };
            return s;
          }),
        };
      });
    },
    [updateActive],
  );

  return {
    hydrated,
    proposals,
    activeId,
    activeProposal,
    pages,
    selectProposal,
    addProposal,
    deleteProposal,
    updateActive,
    patchMeta,
    setTheme,
    toggleSection,
    moveSection,
  };
}

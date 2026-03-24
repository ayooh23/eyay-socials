"use client";

import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import DocsCanvas from "@/components/docs/DocsCanvas";
import {
  DEFAULT_DOC_STUDIO_COVER,
} from "@/lib/docDefaults";
import { buildDocPages, type DocCoverModel } from "@/lib/docPages";
import { exportDocPdf } from "@/lib/plainDocPdfExport";
import type { ProposalProgressFn, ProposalToastFn } from "@/components/proposals/ProposalExport";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface DocsTabProps {
  onProgress: ProposalProgressFn;
  onToast: ProposalToastFn;
  progressFooter: ReactNode;
}

export default function DocsTab({
  onProgress,
  onToast,
  progressFooter,
}: DocsTabProps) {
  const defaultDocNumber = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `DOC-${y}-${m}${day}`;
  }, []);

  const [docTitle, setDocTitle] = useState("");
  const [clientLine, setClientLine] = useState("");
  const [docNumber, setDocNumber] = useState(defaultDocNumber);
  const [docType, setDocType] = useState<string>(
    DEFAULT_DOC_STUDIO_COVER.defaultDocType,
  );
  const [sourceText, setSourceText] = useState("");
  const [loadedName, setLoadedName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coverDateIso = useMemo(() => isoDate(new Date()), []);

  const cover: DocCoverModel = useMemo(
    () => ({
      projectName: docTitle,
      clientName: clientLine,
      docNumber,
      proposalDate: coverDateIso,
      docType,
      preparedBy: DEFAULT_DOC_STUDIO_COVER.preparedBy,
      studioEmail: DEFAULT_DOC_STUDIO_COVER.studioEmail,
      studioAddress: DEFAULT_DOC_STUDIO_COVER.studioAddress,
    }),
    [clientLine, coverDateIso, docNumber, docTitle, docType],
  );

  const pages = useMemo(
    () => buildDocPages(cover, sourceText),
    [cover, sourceText],
  );

  const onPickFile = useCallback(() => fileInputRef.current?.click(), []);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setSourceText(text);
      setLoadedName(f.name);
      const base = f.name.replace(/\.[^.]+$/, "");
      if (base) setDocTitle((prev) => (prev.trim() ? prev : base));
    };
    reader.onerror = () => onToast("Could not read file");
    reader.readAsText(f, "UTF-8");
  }, [onToast]);

  const runExport = async () => {
    onProgress("building PDF…", 5);
    try {
      await exportDocPdf(pages, docTitle);
      onProgress("done", 100);
      onToast("Document PDF downloaded");
    } catch (err) {
      onProgress("", -1);
      onToast("Export failed");
      console.error(err);
    }
  };

  return (
    <>
      <aside>
        <div className="sb">
          <div className="sbl">document</div>
          <div className="ctrl">
            <label>source file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.markdown,text/plain"
              style={{ display: "none" }}
              onChange={onFile}
            />
            <button type="button" className="btn btn-p btn-sm" onClick={onPickFile}>
              Insert text file…
            </button>
            {loadedName ? (
              <span
                style={{
                  display: "block",
                  marginTop: 8,
                  fontFamily: "var(--mono)",
                  fontSize: 10,
                  color: "var(--text3)",
                  wordBreak: "break-all",
                }}
              >
                {loadedName}
              </span>
            ) : null}
          </div>
          <div className="ctrl">
            <label htmlFor="doc-title">title (cover + body header)</label>
            <input
              id="doc-title"
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="Document title"
              spellCheck={false}
            />
          </div>
          <div className="ctrl">
            <label htmlFor="doc-client">prepared for (cover)</label>
            <input
              id="doc-client"
              type="text"
              value={clientLine}
              onChange={(e) => setClientLine(e.target.value)}
              placeholder="Client or audience"
              spellCheck={false}
            />
          </div>
          <div className="ctrl">
            <label htmlFor="doc-type">type (cover)</label>
            <input
              id="doc-type"
              type="text"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              placeholder="e.g. Brief, Memo, Spec"
              spellCheck={false}
            />
          </div>
          <div className="ctrl">
            <label htmlFor="doc-number">document number (cover)</label>
            <input
              id="doc-number"
              type="text"
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="DOC-2026-0324"
              spellCheck={false}
            />
          </div>
          <div className="ctrl" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <label htmlFor="doc-body">text</label>
            <textarea
              id="doc-body"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Markdown supported: **bold**, *italic*, `code`, [links](url), lists, headings, tables, blockquotes, fenced code. Blank lines separate blocks."
              spellCheck={false}
              style={{ flex: 1, minHeight: 220, resize: "vertical" }}
            />
          </div>
          <div className="ctrl">
            <span
              style={{
                fontFamily: "var(--mono)",
                fontSize: 10,
                color: "var(--text3)",
              }}
            >
              {pages.length} page{pages.length === 1 ? "" : "s"} · cover + body + About eyay
            </span>
          </div>
        </div>
      </aside>

      <main>
        <div className="cwrap cwrap--docs">
          <DocsCanvas pages={pages} />
          <div className="xbar">
            <span className="xlabel">export</span>
            <button type="button" className="btn btn-g btn-sm" onClick={runExport}>
              Export PDF (A4)
            </button>
          </div>
          {progressFooter}
        </div>
      </main>
    </>
  );
}

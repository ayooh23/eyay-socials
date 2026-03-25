"use client";

import { useEffect, useState } from "react";
import { newFinancialRowId, newGridItemId, newCompRowId, newPackageCardId } from "@/data/defaults";
import { newChatRowId } from "@/lib/chatSlide";
import type {
  Alignment,
  ChatRow,
  ChatSpeed,
  CompRow,
  GlobalStyle,
  GridItem,
  M3Pick,
  PackageCard,
  SlidesFinancialRow,
  SlidesLayout,
  SlidesSlide,
} from "@/lib/types";

const LAYOUTS: SlidesLayout[] = [
  "title",
  "content",
  "bullets",
  "quote",
  "stat",
  "split",
  "cases",
  "terminal",
  "chat",
  "financial",
  "team",
  "pillars",
  "grid",
  "comparison",
  "process",
  "packages",
  "ending",
  "blank",
];

function parseCompColumnsCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeCompRowsToColCount(rows: CompRow[], colCount: number): CompRow[] {
  return rows.map((r) => {
    const cells = [...(r.cells ?? [])];
    while (cells.length < colCount) cells.push("");
    if (cells.length > colCount) cells.length = colCount;
    return { ...r, cells };
  });
}

export interface SlidesSidebarControlsProps {
  slide: SlidesSlide;
  globalStyle: GlobalStyle;
  onPatchSlide: (slideId: string, patch: Partial<SlidesSlide>) => void;
  onChangeGlobal: (patch: Partial<GlobalStyle>) => void;
}

export default function SlidesSidebarControls({
  slide,
  globalStyle,
  onPatchSlide,
  onChangeGlobal,
}: SlidesSidebarControlsProps) {
  const lay = slide.layout;
  const patch = (p: Partial<SlidesSlide>) => onPatchSlide(slide.id, p);
  const chatRows = slide.chatRows ?? [];

  const [compColumnsDraft, setCompColumnsDraft] = useState(() =>
    (slide.compColumns ?? []).join(", "),
  );
  useEffect(() => {
    if (lay === "comparison") {
      setCompColumnsDraft((slide.compColumns ?? []).join(", "));
    }
  }, [lay, slide.id, (slide.compColumns ?? []).join("\u0001")]);

  const updateChatRow = (id: string, part: Partial<ChatRow>) => {
    patch({
      chatRows: chatRows.map((r) => (r.id === id ? { ...r, ...part } : r)),
    });
  };
  const removeChatRow = (id: string) => {
    patch({ chatRows: chatRows.filter((r) => r.id !== id) });
  };
  const addChatRow = () => {
    patch({
      chatRows: [
        ...chatRows,
        { id: newChatRowId(), role: "in", text: "" },
      ],
    });
  };

  const showEyebrow = lay !== "quote" && lay !== "blank";
  const showHeadline =
    lay !== "blank" && lay !== "chat" && lay !== "terminal";

  const financialRows = slide.financialRows ?? [];
  const patchFinancialRow = (id: string, part: Partial<SlidesFinancialRow>) => {
    patch({
      financialRows: financialRows.map((r) =>
        r.id === id ? { ...r, ...part } : r,
      ),
    });
  };
  const removeFinancialRow = (id: string) => {
    patch({ financialRows: financialRows.filter((r) => r.id !== id) });
  };
  const addFinancialRow = () => {
    patch({
      financialRows: [
        ...financialRows,
        {
          id: newFinancialRowId(),
          label: "",
          description: "",
          qty: "1",
          price: "",
        },
      ],
    });
  };

  return (
    <>
      <div className="sb">
        <div className="sbl">layout</div>
        <div className="pills">
          {LAYOUTS.map((v) => (
            <button
              key={v}
              type="button"
              className={`pill ${slide.layout === v ? "on" : ""}`}
              onClick={() => patch({ layout: v })}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="sb">
        <div className="sbl">content</div>

        <div className={`ctrl ${!showEyebrow ? "hidden" : ""}`}>
          <label>{lay === "cases" ? "type / category" : "eyebrow"}</label>
          <input
            type="text"
            value={slide.eyebrow}
            placeholder={lay === "cases" ? "Service Design · Product" : "section · context"}
            onChange={(e) => patch({ eyebrow: e.target.value })}
          />
        </div>

        <div className={`ctrl ${!showHeadline ? "hidden" : ""}`}>
          <label>
            {lay === "quote"
              ? "quote"
              : lay === "ending"
                ? "closing headline"
                : lay === "cases"
                  ? "project name"
                  : "headline / title"}
          </label>
          <textarea
            rows={lay === "title" ? 4 : lay === "ending" ? 3 : 3}
            value={slide.headline}
            placeholder={
              lay === "quote"
                ? "The line worth remembering."
                : lay === "ending"
                  ? "Thank you — or your sign-off line"
                  : "Main title…"
            }
            onChange={(e) => patch({ headline: e.target.value })}
          />
        </div>

        <div
          className={`ctrl ${["title", "content", "split", "cases", "bullets", "ending", "team", "pillars", "process"].includes(lay) ? "" : "hidden"}`}
        >
          <label>
            {lay === "cases" ? "description"
              : lay === "title" ? "tagline / subhead"
              : lay === "bullets" ? "closing line (big)"
              : lay === "team" ? "punchline"
              : lay === "ending" ? "closing copy"
              : "body"}
          </label>
          <textarea
            rows={lay === "cases" || lay === "ending" ? 4 : 3}
            value={slide.body}
            placeholder={
              lay === "cases" ? "What was built and why…"
              : lay === "title" ? "AI-native product studio · Amsterdam"
              : lay === "bullets" ? "Structural advantage."
              : lay === "team" ? "The people you brief are the people who build."
              : lay === "ending" ? "Thanks, contact lines…"
              : "Supporting copy…"
            }
            onChange={(e) => patch({ body: e.target.value })}
          />
        </div>

        <div className={`ctrl ${lay === "quote" ? "" : "hidden"}`}>
          <label>attribution</label>
          <input
            type="text"
            value={slide.body}
            placeholder="— Name, role"
            onChange={(e) => patch({ body: e.target.value })}
          />
        </div>

        {/* ending body merged into the main body field above */}

        <div className={lay === "financial" ? "" : "hidden"}>
          <div className="ctrl">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <label style={{ marginBottom: 0, flex: 1 }}>line items</label>
              <button
                type="button"
                className="btn btn-p btn-sm"
                onClick={addFinancialRow}
              >
                + add row
              </button>
            </div>
            {financialRows.map((row) => (
              <div
                key={row.id}
                className="ctrl"
                style={{
                  marginBottom: 8,
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                <input
                  type="text"
                  placeholder="Label"
                  value={row.label}
                  onChange={(e) =>
                    patchFinancialRow(row.id, { label: e.target.value })
                  }
                />
                <textarea
                  rows={2}
                  placeholder="Description"
                  value={row.description}
                  style={{ marginTop: 6 }}
                  onChange={(e) =>
                    patchFinancialRow(row.id, { description: e.target.value })
                  }
                />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input
                    type="text"
                    placeholder="Qty"
                    value={row.qty}
                    style={{ flex: 0.35 }}
                    onChange={(e) =>
                      patchFinancialRow(row.id, { qty: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Price (e.g. €8,000)"
                    value={row.price}
                    style={{ flex: 1 }}
                    onChange={(e) =>
                      patchFinancialRow(row.id, { price: e.target.value })
                    }
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-g btn-sm"
                  style={{ marginTop: 8 }}
                  onClick={() => removeFinancialRow(row.id)}
                >
                  remove row
                </button>
              </div>
            ))}
          </div>
          <div className="ctrl">
            <label>VAT / tax note</label>
            <input
              type="text"
              value={slide.financialVatNote}
              placeholder="VAT and local taxes as applicable."
              onChange={(e) => patch({ financialVatNote: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>payment terms</label>
            <input
              type="text"
              value={slide.financialPaymentTerms}
              placeholder="50% upfront…"
              onChange={(e) => patch({ financialPaymentTerms: e.target.value })}
            />
          </div>
        </div>

        <div className={lay === "bullets" || lay === "ending" || lay === "process" ? "" : "hidden"}>
          <div className="ctrl">
            <label>item 1</label>
            <input
              type="text"
              value={slide.l1}
              onChange={(e) => patch({ l1: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>item 2</label>
            <input
              type="text"
              value={slide.l2}
              onChange={(e) => patch({ l2: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>item 3</label>
            <input
              type="text"
              value={slide.l3}
              onChange={(e) => patch({ l3: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>item 4 (opt)</label>
            <input
              type="text"
              value={slide.l4}
              onChange={(e) => patch({ l4: e.target.value })}
            />
          </div>
        </div>

        <div className={lay === "stat" ? "" : "hidden"}>
          <div className="ctrl">
            <label>stat 1 number</label>
            <input
              type="text"
              value={slide.s1n}
              onChange={(e) => patch({ s1n: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>stat 1 label</label>
            <input
              type="text"
              value={slide.s1l}
              onChange={(e) => patch({ s1l: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>stat 2 number</label>
            <input
              type="text"
              value={slide.s2n}
              onChange={(e) => patch({ s2n: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>stat 2 label</label>
            <input
              type="text"
              value={slide.s2l}
              onChange={(e) => patch({ s2l: e.target.value })}
            />
          </div>
        </div>

        <div className={lay === "split" ? "" : "hidden"}>
          <div className="ctrl">
            <label>upload image</label>
            <input
              type="file"
              accept="image/*"
              style={{
                width: "100%",
                fontSize: 11,
                fontFamily: "var(--mono)",
              }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  patch({ splitImageDataUrl: String(reader.result ?? "") });
                };
                reader.readAsDataURL(f);
                e.target.value = "";
              }}
            />
            {slide.splitImageDataUrl ? (
              <button
                type="button"
                className="btn btn-g btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => patch({ splitImageDataUrl: "" })}
              >
                remove image
              </button>
            ) : null}
          </div>
          <div className="ctrl">
            <label>image placeholder label</label>
            <input
              type="text"
              value={slide.imageHint}
              placeholder="Image"
              onChange={(e) => patch({ imageHint: e.target.value })}
            />
          </div>
        </div>

        <div className={lay === "cases" ? "" : "hidden"}>
          <div className="ctrl">
            <label>client</label>
            <input
              type="text"
              value={slide.caseClient}
              placeholder="OLVG Amsterdam"
              onChange={(e) => patch({ caseClient: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>key result</label>
            <input
              type="text"
              value={slide.caseResult}
              placeholder="Service discovery in under 30 seconds"
              onChange={(e) => patch({ caseResult: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="ctrl" style={{ flex: 0.35 }}>
              <label>prompt</label>
              <input
                type="text"
                value={slide.termPrompt}
                placeholder="eyay"
                onChange={(e) => patch({ termPrompt: e.target.value })}
              />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>terminal line</label>
              <textarea
                rows={3}
                value={slide.term}
                placeholder="deployed — live in production"
                onChange={(e) => patch({ term: e.target.value })}
              />
            </div>
          </div>
          <div className="ctrl">
            <label>upload visual</label>
            <input
              type="file"
              accept="image/*"
              style={{
                width: "100%",
                fontSize: 11,
                fontFamily: "var(--mono)",
              }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const reader = new FileReader();
                reader.onload = () => {
                  patch({ splitImageDataUrl: String(reader.result ?? "") });
                };
                reader.readAsDataURL(f);
                e.target.value = "";
              }}
            />
            {slide.splitImageDataUrl ? (
              <button
                type="button"
                className="btn btn-g btn-sm"
                style={{ marginTop: 8 }}
                onClick={() => patch({ splitImageDataUrl: "" })}
              >
                remove image
              </button>
            ) : null}
          </div>
          <div className="ctrl">
            <label>image placeholder label</label>
            <input
              type="text"
              value={slide.imageHint}
              placeholder="Screenshot"
              onChange={(e) => patch({ imageHint: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>name incoming</label>
              <input
                type="text"
                value={slide.sn1}
                placeholder="Sinyo"
                onChange={(e) => patch({ sn1: e.target.value })}
              />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>name outgoing</label>
              <input
                type="text"
                value={slide.sn2}
                placeholder="Ayu"
                onChange={(e) => patch({ sn2: e.target.value })}
              />
            </div>
          </div>
          <div className="ctrl">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <label style={{ marginBottom: 0, flex: 1 }}>chat thread</label>
              <button
                type="button"
                className="btn btn-p btn-sm"
                onClick={addChatRow}
              >
                + add
              </button>
            </div>
            {chatRows.map((row, i) => (
              <div
                key={row.id}
                className="ctrl"
                style={{ marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span
                    className="rv"
                    style={{ minWidth: 16, textAlign: "left" }}
                  >
                    {i + 1}
                  </span>
                  <div className="pills">
                    <button
                      type="button"
                      className={`pill ${row.role === "in" ? "on" : ""}`}
                      onClick={() => updateChatRow(row.id, { role: "in" })}
                    >
                      in
                    </button>
                    <button
                      type="button"
                      className={`pill ${row.role === "out" ? "on" : ""}`}
                      onClick={() => updateChatRow(row.id, { role: "out" })}
                    >
                      out
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => removeChatRow(row.id)}
                    aria-label="Delete message"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={row.text}
                  placeholder="Message…"
                  onChange={(e) =>
                    updateChatRow(row.id, { text: e.target.value })
                  }
                />
              </div>
            ))}
          </div>
        </div>

        <div className={lay === "terminal" ? "" : "hidden"}>
          <div className="ctrl">
            <label>prompt label</label>
            <input
              type="text"
              value={slide.termPrompt}
              placeholder="eyay"
              onChange={(e) => patch({ termPrompt: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>terminal text</label>
            <textarea
              rows={5}
              value={slide.term}
              placeholder="where ideas get built today&#10;&#10;use **bold**, *italic*, `code`"
              onChange={(e) => patch({ term: e.target.value })}
            />
          </div>
        </div>

        <div className={lay === "team" ? "" : "hidden"}>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>person 1 name</label>
              <input type="text" value={slide.sn1} placeholder="Ayu" onChange={(e) => patch({ sn1: e.target.value })} />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>person 2 name</label>
              <input type="text" value={slide.sn2} placeholder="Sinyo" onChange={(e) => patch({ sn2: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>role 1</label>
              <input type="text" value={slide.s1l} placeholder="Design & product" onChange={(e) => patch({ s1l: e.target.value })} />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>role 2</label>
              <input type="text" value={slide.s2l} placeholder="Engineering & AI" onChange={(e) => patch({ s2l: e.target.value })} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>person 1 bullets</label>
              <input type="text" value={slide.l1} placeholder="Bullet 1" onChange={(e) => patch({ l1: e.target.value })} style={{ marginBottom: 6 }} />
              <input type="text" value={slide.l2} placeholder="Bullet 2" onChange={(e) => patch({ l2: e.target.value })} />
            </div>
            <div className="ctrl" style={{ flex: 1 }}>
              <label>person 2 bullets</label>
              <input type="text" value={slide.l3} placeholder="Bullet 1" onChange={(e) => patch({ l3: e.target.value })} style={{ marginBottom: 6 }} />
              <input type="text" value={slide.l4} placeholder="Bullet 2" onChange={(e) => patch({ l4: e.target.value })} />
            </div>
          </div>
        </div>

        <div className={lay === "pillars" ? "" : "hidden"}>
          {[
            { label: "pillar 1", tk: "p1title" as const, bk: "p1body" as const },
            { label: "pillar 2", tk: "p2title" as const, bk: "p2body" as const },
            { label: "pillar 3", tk: "p3title" as const, bk: "p3body" as const },
          ].map((p) => (
            <div key={p.tk} className="ctrl" style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
              <label>{p.label} title</label>
              <input type="text" value={slide[p.tk] ?? ""} placeholder="Pillar title" onChange={(e) => patch({ [p.tk]: e.target.value })} />
              <label style={{ marginTop: 6 }}>{p.label} body</label>
              <textarea rows={2} value={slide[p.bk] ?? ""} placeholder="Description…" onChange={(e) => patch({ [p.bk]: e.target.value })} />
            </div>
          ))}
        </div>

        <div className={lay === "grid" ? "" : "hidden"}>
          <div className="ctrl">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <label style={{ marginBottom: 0, flex: 1 }}>tiles</label>
              <button type="button" className="btn btn-p btn-sm" onClick={() => patch({ gridItems: [...(slide.gridItems ?? []), { id: newGridItemId(), title: "", description: "" }] })}>+ add tile</button>
            </div>
            {(slide.gridItems ?? []).map((it: GridItem) => (
              <div key={it.id} className="ctrl" style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <input type="text" value={it.title} placeholder="Offer name" onChange={(e) => patch({ gridItems: (slide.gridItems ?? []).map((g: GridItem) => g.id === it.id ? { ...g, title: e.target.value } : g) })} />
                <input type="text" value={it.description} placeholder="→ outcome" style={{ marginTop: 6 }} onChange={(e) => patch({ gridItems: (slide.gridItems ?? []).map((g: GridItem) => g.id === it.id ? { ...g, description: e.target.value } : g) })} />
                <button type="button" className="btn btn-g btn-sm" style={{ marginTop: 6 }} onClick={() => patch({ gridItems: (slide.gridItems ?? []).filter((g: GridItem) => g.id !== it.id) })}>remove</button>
              </div>
            ))}
          </div>
        </div>

        <div className={lay === "comparison" ? "" : "hidden"}>
          <div className="ctrl">
            <label>columns (comma-separated, blur or Enter)</label>
            <input
              type="text"
              value={compColumnsDraft}
              placeholder="Agency, Freelancer, AI consultancy, eyay"
              onChange={(e) => setCompColumnsDraft(e.target.value)}
              onBlur={() => {
                const parsed = parseCompColumnsCsv(compColumnsDraft);
                patch({
                  compColumns: parsed,
                  compRows: normalizeCompRowsToColCount(slide.compRows ?? [], parsed.length),
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
            />
          </div>
          <div className="ctrl">
            <label>highlight column (0-indexed, -1 = none)</label>
            <input type="number" value={String(slide.compHighlight ?? -1)} onChange={(e) => { const v = Number.parseInt(e.target.value, 10); patch({ compHighlight: Number.isNaN(v) ? -1 : v }); }} />
          </div>
          <div className="ctrl">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <label style={{ marginBottom: 0, flex: 1 }}>rows</label>
              <button type="button" className="btn btn-p btn-sm" onClick={() => {
                const n = (slide.compColumns ?? []).length;
                patch({ compRows: [...(slide.compRows ?? []), { id: newCompRowId(), label: "", cells: Array.from({ length: n }, () => "") }] });
              }}>+ add row</button>
            </div>
            {(slide.compColumns ?? []).length === 0 ? (
              <div style={{ fontSize: 10, color: "var(--text3)", fontFamily: "var(--mono)", marginBottom: 8 }}>Set column headers above, then add rows.</div>
            ) : null}
            {(slide.compRows ?? []).map((row: CompRow) => {
              const colCount = (slide.compColumns ?? []).length;
              return (
                <div key={row.id} className="ctrl" style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                  <input type="text" value={row.label} placeholder="Row label" onChange={(e) => patch({ compRows: (slide.compRows ?? []).map((r: CompRow) => r.id === row.id ? { ...r, label: e.target.value } : r) })} />
                  <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
                    {Array.from({ length: colCount }, (_, ci) => (
                      <input
                        key={ci}
                        type="text"
                        value={(row.cells ?? [])[ci] ?? ""}
                        placeholder={(slide.compColumns ?? [])[ci] || `Col ${ci + 1}`}
                        style={{ flex: 1, minWidth: 60 }}
                        onChange={(e) => {
                          const cells = [...(row.cells ?? [])];
                          while (cells.length < colCount) cells.push("");
                          cells[ci] = e.target.value;
                          patch({ compRows: (slide.compRows ?? []).map((r: CompRow) => r.id === row.id ? { ...r, cells } : r) });
                        }}
                      />
                    ))}
                  </div>
                  <button type="button" className="btn btn-g btn-sm" style={{ marginTop: 6 }} onClick={() => patch({ compRows: (slide.compRows ?? []).filter((r: CompRow) => r.id !== row.id) })}>remove</button>
                </div>
              );
            })}
          </div>
        </div>

        <div className={lay === "process" ? "" : "hidden"}>
          <div className="ctrl">
            <label>payment terms (opt)</label>
            <input type="text" value={slide.financialPaymentTerms} placeholder="50% upfront…" onChange={(e) => patch({ financialPaymentTerms: e.target.value })} />
          </div>
        </div>

        <div className={lay === "packages" ? "" : "hidden"}>
          <div className="ctrl">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <label style={{ marginBottom: 0, flex: 1 }}>packages</label>
              <button type="button" className="btn btn-p btn-sm" onClick={() => patch({ packageCards: [...(slide.packageCards ?? []), { id: newPackageCardId(), name: "", price: "", duration: "", items: "", recommended: false }] })}>+ add</button>
            </div>
            {(slide.packageCards ?? []).map((c: PackageCard) => (
              <div key={c.id} className="ctrl" style={{ border: c.recommended ? "2px solid var(--accent)" : "1px solid var(--border)", borderRadius: 6, padding: 8, marginBottom: 8 }}>
                <input type="text" value={c.name} placeholder="Package name" onChange={(e) => patch({ packageCards: (slide.packageCards ?? []).map((p: PackageCard) => p.id === c.id ? { ...p, name: e.target.value } : p) })} />
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <input type="text" value={c.price} placeholder="€8,000" style={{ flex: 1 }} onChange={(e) => patch({ packageCards: (slide.packageCards ?? []).map((p: PackageCard) => p.id === c.id ? { ...p, price: e.target.value } : p) })} />
                  <input type="text" value={c.duration} placeholder="4 weeks" style={{ flex: 1 }} onChange={(e) => patch({ packageCards: (slide.packageCards ?? []).map((p: PackageCard) => p.id === c.id ? { ...p, duration: e.target.value } : p) })} />
                </div>
                <textarea rows={3} value={c.items} placeholder="Deliverable 1&#10;Deliverable 2&#10;Deliverable 3" style={{ marginTop: 6 }} onChange={(e) => patch({ packageCards: (slide.packageCards ?? []).map((p: PackageCard) => p.id === c.id ? { ...p, items: e.target.value } : p) })} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <label style={{ marginBottom: 0 }}>
                    <input type="checkbox" checked={c.recommended} onChange={(e) => patch({ packageCards: (slide.packageCards ?? []).map((p: PackageCard) => p.id === c.id ? { ...p, recommended: e.target.checked } : p) })} /> recommended
                  </label>
                  <button type="button" className="btn btn-g btn-sm" style={{ marginLeft: "auto" }} onClick={() => patch({ packageCards: (slide.packageCards ?? []).filter((p: PackageCard) => p.id !== c.id) })}>remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={lay === "chat" ? "" : "hidden"}>
          <div className="ctrl">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 6,
              }}
            >
              <label style={{ marginBottom: 0, flex: 1 }}>messages</label>
              <button
                type="button"
                className="btn btn-p btn-sm"
                onClick={addChatRow}
              >
                + add
              </button>
            </div>
            {chatRows.length === 0 ? (
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text3)",
                  lineHeight: 1.5,
                  fontFamily: "var(--mono)",
                  marginBottom: 10,
                }}
              >
                List empty — classic fields below, or + add to start a custom
                thread.
              </div>
            ) : null}
            {chatRows.map((row, i) => (
              <div
                key={row.id}
                className="ctrl"
                style={{ marginBottom: 8 }}
              >
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span
                    className="rv"
                    style={{ minWidth: 16, textAlign: "left" }}
                  >
                    {i + 1}
                  </span>
                  <div className="pills">
                    <button
                      type="button"
                      className={`pill ${row.role === "in" ? "on" : ""}`}
                      onClick={() => updateChatRow(row.id, { role: "in" })}
                    >
                      in
                    </button>
                    <button
                      type="button"
                      className={`pill ${row.role === "out" ? "on" : ""}`}
                      onClick={() => updateChatRow(row.id, { role: "out" })}
                    >
                      out
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-g btn-sm"
                    onClick={() => removeChatRow(row.id)}
                    aria-label="Delete message"
                  >
                    × delete
                  </button>
                </div>
                <input
                  type="text"
                  value={row.text}
                  placeholder="Message…"
                  onChange={(e) =>
                    updateChatRow(row.id, { text: e.target.value })
                  }
                />
              </div>
            ))}
            {chatRows.length === 0 ? (
              <>
                <div className="ctrl">
                  <label>msg 1 — incoming</label>
                  <input
                    type="text"
                    value={slide.m1}
                    placeholder="Ey ay"
                    onChange={(e) => patch({ m1: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 2 — outgoing</label>
                  <input
                    type="text"
                    value={slide.m2}
                    placeholder="What if we built…"
                    onChange={(e) => patch({ m2: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — lead-in (Sinyo, before variant)</label>
                  <input
                    type="text"
                    value={slide.m3Lead}
                    placeholder="Yeah — I'm thinking…"
                    onChange={(e) => patch({ m3Lead: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — active variant</label>
                  <div className="pills">
                    {([0, 1, 2] as M3Pick[]).map((v) => (
                        <button
                          key={v}
                          type="button"
                          className={`pill ${slide.m3Pick === v ? "on" : ""}`}
                          onClick={() => patch({ m3Pick: v })}
                        >
                          {v === 0 ? "A" : v === 1 ? "B" : "C"}
                        </button>
                    ))}
                  </div>
                </div>
                <div className="ctrl">
                  <label>msg 3 — line A</label>
                  <input
                    type="text"
                    value={slide.m3}
                    placeholder="…something that just works"
                    onChange={(e) => patch({ m3: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — line B</label>
                  <input
                    type="text"
                    value={slide.m3b}
                    placeholder="Alternate line…"
                    onChange={(e) => patch({ m3b: e.target.value })}
                  />
                </div>
                <div className="ctrl">
                  <label>msg 3 — line C</label>
                  <input
                    type="text"
                    value={slide.m3c}
                    placeholder="Another option…"
                    onChange={(e) => patch({ m3c: e.target.value })}
                  />
                </div>
              </>
            ) : null}
          </div>
          <div className="ctrl">
            <label>name above incoming bubbles</label>
            <input
              type="text"
              value={slide.sn1}
              placeholder="Sinyo"
              onChange={(e) => patch({ sn1: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>name above outgoing bubble</label>
            <input
              type="text"
              value={slide.sn2}
              placeholder="Ayu"
              onChange={(e) => patch({ sn2: e.target.value })}
            />
          </div>
          <div className="ctrl">
            <label>animation speed</label>
            <div className="pills">
              {(["normal", "fast", "slow"] as ChatSpeed[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`pill ${slide.chatSpeed === v ? "on" : ""}`}
                  onClick={() => patch({ chatSpeed: v })}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ctrl">
          <label>footer / cta</label>
          <input
            type="text"
            value={slide.cta}
            placeholder="eyay.studio"
            onChange={(e) => patch({ cta: e.target.value })}
          />
        </div>
      </div>

      <div className="sb">
        <div className="sbl">this slide</div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text3)",
            lineHeight: 1.5,
            marginBottom: 10,
            fontFamily: "var(--mono)",
          }}
        >
          Color theme and alignment apply only to the selected slide.
        </div>

        <div className="ctrl">
          <label>color theme</label>
          <div className="swatches">
            <button
              type="button"
              title="Dark"
              className={`swatch ${slide.theme === "dark" ? "on" : ""}`}
              style={{ background: "#0a0a0a", border: "2px solid #333" }}
              onClick={() => patch({ theme: "dark" })}
            />
            <button
              type="button"
              title="Light"
              className={`swatch ${slide.theme === "light" ? "on" : ""}`}
              style={{ background: "#f5f5f5" }}
              onClick={() => patch({ theme: "light" })}
            />
            <button
              type="button"
              title="Blue"
              className={`swatch ${slide.theme === "blue" ? "on" : ""}`}
              style={{ background: "#0000FF" }}
              onClick={() => patch({ theme: "blue" })}
            />
            <button
              type="button"
              title="Cream"
              className={`swatch ${slide.theme === "cream" ? "on" : ""}`}
              style={{ background: "#faf8f4" }}
              onClick={() => patch({ theme: "cream" })}
            />
            <button
              type="button"
              title="Midnight"
              className={`swatch ${slide.theme === "midnight" ? "on" : ""}`}
              style={{ background: "#1a1a2e" }}
              onClick={() => patch({ theme: "midnight" })}
            />
            <button
              type="button"
              title="Red"
              className={`swatch ${slide.theme === "red" ? "on" : ""}`}
              style={{ background: "#ef4444" }}
              onClick={() => patch({ theme: "red" })}
            />
          </div>
        </div>

        <div className="ctrl">
          <label>alignment</label>
          <div className="pills">
            {(["left", "center", "right"] as Alignment[]).map((a) => (
              <button
                key={a}
                type="button"
                className={`pill ${(slide.align ?? "left") === a ? "on" : ""}`}
                onClick={() => patch({ align: a })}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sb">
        <div className="sbl">slides deck</div>
        <div
          style={{
            fontSize: 10,
            color: "var(--text3)",
            lineHeight: 1.5,
            marginBottom: 10,
            fontFamily: "var(--mono)",
          }}
        >
          Headline size and header/footer toggles apply to every slide.
        </div>

        <div className="ctrl">
          <label>headline size</label>
          <div className="range-row">
            <input
              type="range"
              min={48}
              max={140}
              value={globalStyle.size}
              onChange={(e) =>
                onChangeGlobal({ size: parseInt(e.target.value, 10) })
              }
            />
            <span className="rv">{globalStyle.size}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div className="ctrl" style={{ flex: 1 }}>
            <label>studio tag</label>
            <div className="pills">
              <button
                type="button"
                className={`pill ${globalStyle.showTag ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showTag: true })}
              >
                on
              </button>
              <button
                type="button"
                className={`pill ${!globalStyle.showTag ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showTag: false })}
              >
                off
              </button>
            </div>
          </div>
          <div className="ctrl" style={{ flex: 1 }}>
            <label>slide num</label>
            <div className="pills">
              <button
                type="button"
                className={`pill ${globalStyle.showNum ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showNum: true })}
              >
                on
              </button>
              <button
                type="button"
                className={`pill ${!globalStyle.showNum ? "on" : ""}`}
                onClick={() => onChangeGlobal({ showNum: false })}
              >
                off
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

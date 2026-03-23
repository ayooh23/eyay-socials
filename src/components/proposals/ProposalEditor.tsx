"use client";

import { useCallback, useMemo, useState } from "react";
import { newEntityId } from "@/lib/proposalDefaults";
import { getSectionStartPageIndex, SECTION_TITLES } from "@/lib/proposalPaginate";
import { PROPOSAL_THEMES } from "@/lib/proposalThemes";
import type {
  DeliverableItem,
  FlowStepItem,
  InvestmentLineItem,
  PricingComparisonRow,
  Proposal,
  ProposalTheme,
  ScopeBulletItem,
  SectionType,
  TeamMemberSide,
  TimelinePhase,
} from "@/lib/proposalTypes";

type SubTab = "details" | "sections" | "content";

const CONTENT_TYPES: SectionType[] = [
  "about",
  "about-eya",
  "project-scope",
  "deliverables",
  "how-we-work",
  "timeline",
  "team",
  "pricing-options",
  "investment",
  "terms",
  "decisions",
  "next-steps",
];

export interface ProposalEditorProps {
  proposal: Proposal;
  proposals: Proposal[];
  activeId: string;
  onSelectProposal: (id: string) => void;
  onAddProposal: () => void;
  onDeleteProposal: (id: string) => void;
  patchMeta: (patch: Partial<Proposal["meta"]>) => void;
  setTheme: (t: ProposalTheme) => void;
  toggleSection: (type: SectionType) => void;
  moveSection: (type: SectionType, dir: -1 | 1) => void;
  updateActive: (fn: (p: Proposal) => Proposal) => void;
  onJumpToPage: (pageIndex: number) => void;
}

export default function ProposalEditor({
  proposal,
  proposals,
  activeId,
  onSelectProposal,
  onAddProposal,
  onDeleteProposal,
  patchMeta,
  setTheme,
  toggleSection,
  moveSection,
  updateActive,
  onJumpToPage,
}: ProposalEditorProps) {
  const [sub, setSub] = useState<SubTab>("details");
  const [contentSection, setContentSection] = useState<SectionType>("about");

  const sortedSections = useMemo(
    () => [...proposal.sections].sort((a, b) => a.order - b.order),
    [proposal.sections],
  );

  const jumpSection = useCallback(
    (type: SectionType) => {
      const idx = getSectionStartPageIndex(proposal, type);
      onJumpToPage(idx);
    },
    [proposal, onJumpToPage],
  );

  return (
    <>
      <div className="sb">
        <div className="sbl">proposals</div>
        <button
          type="button"
          className="btn btn-p btn-sm"
          style={{ width: "100%", marginBottom: 8 }}
          onClick={onAddProposal}
        >
          + New proposal
        </button>
        <div style={{ maxHeight: 120, overflowY: "auto" }}>
          {proposals.map((p) => (
            <div
              key={p.id}
              className="prop-prop-row"
              style={{
                background:
                  p.id === activeId ? "var(--surface2)" : "transparent",
                borderRadius: 6,
                padding: "6px 8px",
                marginBottom: 4,
                cursor: "pointer",
              }}
              onClick={() => onSelectProposal(p.id)}
            >
              <span style={{ flex: 1, textAlign: "left" }}>
                {p.meta.proposalNumber || "—"}{" "}
                <span style={{ color: "var(--text3)" }}>
                  {p.meta.clientName || "Untitled client"}
                </span>
              </span>
              {proposals.length > 1 ? (
                <button
                  type="button"
                  className="btn btn-g btn-sm prop-del"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteProposal(p.id);
                  }}
                >
                  ×
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="sb">
        <div className="sbl">editor</div>
        <div className="prop-subtabs">
          {(
            [
              ["details", "Details"],
              ["sections", "Sections"],
              ["content", "Content"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`prop-subtab ${sub === k ? "on" : ""}`}
              onClick={() => setSub(k)}
            >
              {label}
            </button>
          ))}
        </div>

        {sub === "details" ? (
          <DetailsTab proposal={proposal} patchMeta={patchMeta} setTheme={setTheme} />
        ) : null}
        {sub === "sections" ? (
          <SectionsTab
            sortedSections={sortedSections}
            toggleSection={toggleSection}
            moveSection={moveSection}
            jumpSection={jumpSection}
          />
        ) : null}
        {sub === "content" ? (
          <ContentTab
            proposal={proposal}
            contentSection={contentSection}
            setContentSection={setContentSection}
            updateActive={updateActive}
          />
        ) : null}
      </div>
    </>
  );
}

function DetailsTab({
  proposal,
  patchMeta,
  setTheme,
}: {
  proposal: Proposal;
  patchMeta: ProposalEditorProps["patchMeta"];
  setTheme: ProposalEditorProps["setTheme"];
}) {
  const m = proposal.meta;
  const themes: ProposalTheme[] = ["dark", "light", "cream"];
  return (
    <>
      <div className="ctrl">
        <label>client name</label>
        <input
          type="text"
          value={m.clientName}
          onChange={(e) => patchMeta({ clientName: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>client contact</label>
        <input
          type="text"
          value={m.clientContact}
          onChange={(e) => patchMeta({ clientContact: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>project name</label>
        <input
          type="text"
          value={m.projectName}
          onChange={(e) => patchMeta({ projectName: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>proposal number</label>
        <input
          type="text"
          value={m.proposalNumber}
          onChange={(e) => patchMeta({ proposalNumber: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>date</label>
        <input
          type="date"
          value={m.proposalDate}
          onChange={(e) => patchMeta({ proposalDate: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>valid until</label>
        <input
          type="date"
          value={m.validUntil}
          onChange={(e) => patchMeta({ validUntil: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>studio contact</label>
        <input
          type="text"
          value={m.studioContact}
          onChange={(e) => patchMeta({ studioContact: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>studio email</label>
        <input
          type="text"
          value={m.studioEmail}
          onChange={(e) => patchMeta({ studioEmail: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>studio address (cover)</label>
        <input
          type="text"
          value={m.studioAddress}
          onChange={(e) => patchMeta({ studioAddress: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>prepared by (cover)</label>
        <input
          type="text"
          value={m.preparedBy}
          onChange={(e) => patchMeta({ preparedBy: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>status (cover)</label>
        <input
          type="text"
          value={m.proposalStatus}
          onChange={(e) => patchMeta({ proposalStatus: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>theme</label>
        <div className="swatches">
          {themes.map((tk) => (
            <button
              key={tk}
              type="button"
              className={`swatch ${proposal.theme === tk ? "on" : ""}`}
              style={{ background: PROPOSAL_THEMES[tk].bg }}
              title={tk}
              onClick={() => setTheme(tk)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function SectionsTab({
  sortedSections,
  toggleSection,
  moveSection,
  jumpSection,
}: {
  sortedSections: Proposal["sections"];
  toggleSection: ProposalEditorProps["toggleSection"];
  moveSection: ProposalEditorProps["moveSection"];
  jumpSection: (t: SectionType) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {sortedSections.map((s, idx) => (
        <div
          key={s.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className={`pill ${s.enabled ? "on" : ""}`}
            style={{ flex: 1, minWidth: 120, textAlign: "left" }}
            onClick={() =>
              s.type === "cover" ? jumpSection("cover") : toggleSection(s.type)
            }
            title={s.type === "cover" ? "Cover is always on" : "Toggle section"}
          >
            {SECTION_TITLES[s.type]}
            {s.type === "cover" ? " · fixed" : ""}
          </button>
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() => jumpSection(s.type)}
          >
            view
          </button>
          {s.type !== "cover" ? (
            <>
              <button
                type="button"
                className="nav-btn"
                disabled={idx <= 1}
                onClick={() => moveSection(s.type, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="nav-btn"
                disabled={idx >= sortedSections.length - 1}
                onClick={() => moveSection(s.type, 1)}
              >
                ↓
              </button>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ContentTab({
  proposal,
  contentSection,
  setContentSection,
  updateActive,
}: {
  proposal: Proposal;
  contentSection: SectionType;
  setContentSection: (t: SectionType) => void;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  return (
    <>
      <div className="ctrl">
        <label>section</label>
        <div className="pills">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`pill ${contentSection === t ? "on" : ""}`}
              onClick={() => setContentSection(t)}
            >
              {SECTION_TITLES[t]}
            </button>
          ))}
        </div>
      </div>
      {contentSection === "about" ? (
        <AboutFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "about-eya" ? (
        <EyaAboutFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "project-scope" ? (
        <ProjectScopeFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "deliverables" ? (
        <DeliverablesFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "how-we-work" ? (
        <HowFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "timeline" ? (
        <TimelineFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "team" ? (
        <TeamFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "pricing-options" ? (
        <PricingOptionsFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "investment" ? (
        <InvestmentFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "terms" ? (
        <TermsFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "decisions" ? (
        <DecisionsFields proposal={proposal} updateActive={updateActive} />
      ) : null}
      {contentSection === "next-steps" ? (
        <NextFields proposal={proposal} updateActive={updateActive} />
      ) : null}
    </>
  );
}

function AboutFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const a = proposal.about;
  return (
    <>
      <div className="ctrl">
        <label>context</label>
        <textarea
          rows={4}
          value={a.context}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              about: { ...p.about, context: e.target.value },
            }))
          }
        />
      </div>
      <div className="ctrl">
        <label>problem</label>
        <textarea
          rows={4}
          value={a.problem}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              about: { ...p.about, problem: e.target.value },
            }))
          }
        />
      </div>
      <div className="ctrl">
        <label>approach</label>
        <textarea
          rows={4}
          value={a.approach}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              about: { ...p.about, approach: e.target.value },
            }))
          }
        />
      </div>
    </>
  );
}

function EyaAboutFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const a = proposal.eyaAbout;
  const patch = (partial: Partial<typeof a>) =>
    updateActive((p) => ({
      ...p,
      eyaAbout: { ...p.eyaAbout, ...partial },
    }));

  const DEFAULT_HEADLINE = "your idea from this morning, built today.";
  const DEFAULT_BODY =
    "eyay studio is a two-person digital product studio based in Amsterdam. We design and build products that sit at the intersection of strategy, technology, and craft — from first brief to shipped product.\n\nWe work AI-native: research, design, and development all move faster because we use the right tools at every stage. What we don't automate is judgment — what to build, how it should feel, and whether it's actually ready.\n\nWe're end-to-end by design. The same people who frame the problem ship the product. No handoffs, no lost context, no PDFs thrown over a wall.\n\n23plusone Live is a project we believe in. The collective has built something that genuinely works — and we want to help take it further.\n\n[hello@eyay.studio](mailto:hello@eyay.studio) — [eyay.studio](http://eyay.studio) — Amsterdam, Netherlands";

  return (
    <>
      <div className="ctrl">
        <label>headline</label>
        <input
          type="text"
          value={a.headline}
          onChange={(e) => patch({ headline: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>boilerplate body</label>
        <textarea
          rows={10}
          value={a.body}
          onChange={(e) => patch({ body: e.target.value })}
        />
      </div>
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() => patch({ headline: DEFAULT_HEADLINE, body: DEFAULT_BODY })}
      >
        Reset to boilerplate
      </button>
    </>
  );
}

function DeliverablesFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const d = proposal.deliverables;
  const patchItems = (items: DeliverableItem[]) =>
    updateActive((p) => ({
      ...p,
      deliverables: { ...p.deliverables, items },
    }));

  return (
    <>
      <div className="ctrl">
        <label>intro</label>
        <textarea
          rows={3}
          value={d.intro}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              deliverables: { ...p.deliverables, intro: e.target.value },
            }))
          }
        />
      </div>
      <div className="sbl" style={{ marginTop: 8 }}>
        items
      </div>
      {d.items.map((it) => (
        <div key={it.id} className="ctrl" style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            style={{ flex: 1 }}
            value={it.label}
            onChange={(e) => {
              const next = d.items.map((x) =>
                x.id === it.id ? { ...x, label: e.target.value } : x,
              );
              patchItems(next);
            }}
          />
          <button
            type="button"
            className={`pill ${it.included ? "on" : ""}`}
            onClick={() => {
              const next = d.items.map((x) =>
                x.id === it.id ? { ...x, included: !x.included } : x,
              );
              patchItems(next);
            }}
          >
            in
          </button>
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() => patchItems(d.items.filter((x) => x.id !== it.id))}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        style={{ marginTop: 6 }}
        onClick={() =>
          patchItems([
            ...d.items,
            { id: newEntityId(), label: "New deliverable", included: true },
          ])
        }
      >
        + add item
      </button>
    </>
  );
}

function HowFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const pillars = proposal.howWeWork.pillars;
  return (
    <>
      {pillars.map((pl, i) => (
        <div key={i} className="ctrl" style={{ marginBottom: 12 }}>
          <label>pillar {i + 1} tag</label>
          <input
            type="text"
            value={pl.tag}
            onChange={(e) => {
              const next = [...pillars];
              next[i] = { ...next[i]!, tag: e.target.value };
              updateActive((p) => ({
                ...p,
                howWeWork: { pillars: next },
              }));
            }}
          />
          <label style={{ marginTop: 8 }}>headline</label>
          <input
            type="text"
            value={pl.headline}
            onChange={(e) => {
              const next = [...pillars];
              next[i] = { ...next[i]!, headline: e.target.value };
              updateActive((p) => ({
                ...p,
                howWeWork: { pillars: next },
              }));
            }}
          />
          <label style={{ marginTop: 8 }}>description</label>
          <textarea
            rows={3}
            value={pl.desc}
            onChange={(e) => {
              const next = [...pillars];
              next[i] = { ...next[i]!, desc: e.target.value };
              updateActive((p) => ({
                ...p,
                howWeWork: { pillars: next },
              }));
            }}
          />
        </div>
      ))}
    </>
  );
}

function TimelineFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const t = proposal.timeline;
  const patchPhases = (phases: TimelinePhase[]) =>
    updateActive((p) => ({
      ...p,
      timeline: { ...p.timeline, phases },
    }));

  return (
    <>
      <div className="ctrl">
        <label>start note</label>
        <input
          type="text"
          value={t.startNote}
          placeholder="Starting the week of 10 March"
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              timeline: { ...p.timeline, startNote: e.target.value },
            }))
          }
        />
      </div>
      {t.phases.map((ph) => (
        <div key={ph.id} className="ctrl">
          <label>phase</label>
          <input
            type="text"
            placeholder="Name"
            value={ph.name}
            onChange={(e) => {
              const next = t.phases.map((x) =>
                x.id === ph.id ? { ...x, name: e.target.value } : x,
              );
              patchPhases(next);
            }}
          />
          <input
            type="text"
            placeholder="Duration"
            value={ph.duration}
            style={{ marginTop: 6 }}
            onChange={(e) => {
              const next = t.phases.map((x) =>
                x.id === ph.id ? { ...x, duration: e.target.value } : x,
              );
              patchPhases(next);
            }}
          />
          <textarea
            rows={2}
            placeholder="Description"
            value={ph.description}
            style={{ marginTop: 6 }}
            onChange={(e) => {
              const next = t.phases.map((x) =>
                x.id === ph.id ? { ...x, description: e.target.value } : x,
              );
              patchPhases(next);
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ marginTop: 6 }}
            onClick={() => patchPhases(t.phases.filter((x) => x.id !== ph.id))}
          >
            remove phase
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patchPhases([
            ...t.phases,
            {
              id: newEntityId(),
              name: "New phase",
              duration: "Week",
              description: "",
            },
          ])
        }
      >
        + add phase
      </button>
    </>
  );
}

function InvestmentFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const inv = proposal.investment;
  const patchItems = (items: InvestmentLineItem[]) =>
    updateActive((p) => ({
      ...p,
      investment: { ...p.investment, items },
    }));

  return (
    <>
      {inv.items.map((row) => (
        <div
          key={row.id}
          className="ctrl"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <input
            type="text"
            placeholder="Label"
            value={row.label}
            onChange={(e) => {
              const next = inv.items.map((x) =>
                x.id === row.id ? { ...x, label: e.target.value } : x,
              );
              patchItems(next);
            }}
          />
          <textarea
            rows={2}
            placeholder="Description"
            value={row.description}
            style={{ marginTop: 6 }}
            onChange={(e) => {
              const next = inv.items.map((x) =>
                x.id === row.id ? { ...x, description: e.target.value } : x,
              );
              patchItems(next);
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <input
              type="number"
              placeholder="Price"
              value={row.price || ""}
              style={{ flex: 1 }}
              onChange={(e) => {
                const next = inv.items.map((x) =>
                  x.id === row.id
                    ? { ...x, price: Number(e.target.value) || 0 }
                    : x,
                );
                patchItems(next);
              }}
            />
            <select
              value={row.unit}
              onChange={(e) => {
                const next = inv.items.map((x) =>
                  x.id === row.id
                    ? {
                        ...x,
                        unit: e.target.value as InvestmentLineItem["unit"],
                      }
                    : x,
                );
                patchItems(next);
              }}
            >
              <option value="fixed">fixed</option>
              <option value="monthly">monthly</option>
              <option value="daily">daily</option>
            </select>
            <input
              type="number"
              min={1}
              value={row.quantity}
              style={{ width: 48 }}
              onChange={(e) => {
                const next = inv.items.map((x) =>
                  x.id === row.id
                    ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) }
                    : x,
                );
                patchItems(next);
              }}
            />
          </div>
          <button
            type="button"
            className={`pill ${row.included ? "on" : ""}`}
            style={{ marginTop: 8 }}
            onClick={() => {
              const next = inv.items.map((x) =>
                x.id === row.id ? { ...x, included: !x.included } : x,
              );
              patchItems(next);
            }}
          >
            include in PDF
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        style={{ marginTop: 6 }}
        onClick={() =>
          patchItems([
            ...inv.items,
            {
              id: newEntityId(),
              label: "Line item",
              description: "",
              price: 0,
              unit: "fixed",
              quantity: 1,
              included: false,
            },
          ])
        }
      >
        + add line item
      </button>
      <div className="ctrl">
        <label>VAT note</label>
        <input
          type="text"
          value={inv.vatNote}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              investment: { ...p.investment, vatNote: e.target.value },
            }))
          }
        />
      </div>
      <div className="ctrl">
        <label>payment terms</label>
        <input
          type="text"
          value={inv.paymentTerms}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              investment: { ...p.investment, paymentTerms: e.target.value },
            }))
          }
        />
      </div>
    </>
  );
}

function TeamFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const members = proposal.team.members;
  const setMembers = (next: typeof members) =>
    updateActive((p) => ({ ...p, team: { members: next } }));

  const addMember = (side: TeamMemberSide) => {
    setMembers([
      ...members,
      {
        id: newEntityId(),
        name: "",
        role: "",
        bio: "",
        side,
      },
    ]);
  };

  const patchMember = (id: string, patch: Partial<(typeof members)[0]>) => {
    setMembers(
      members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  };

  const removeMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const studioMembers = members.filter((m) => m.side === "studio");
  const clientMembers = members.filter((m) => m.side === "client");

  const renderCard = (mem: (typeof members)[0], sideLabel: string) => (
    <div
      key={mem.id}
      className="ctrl"
      style={{
        borderLeft:
          mem.side === "client" ? "3px solid #0d9488" : "3px solid var(--accent)",
        paddingLeft: 10,
        background:
          mem.side === "client"
            ? "rgba(13, 148, 136, 0.08)"
            : "rgba(0, 0, 255, 0.06)",
        borderRadius: 6,
      }}
    >
      <label>
        {sideLabel}
        {mem.side === "client" ? (
          <span style={{ color: "#5eead4", marginLeft: 6, fontSize: 9 }}>
            client
          </span>
        ) : null}
      </label>
      <input
        type="text"
        placeholder="Name"
        value={mem.name}
        onChange={(e) => patchMember(mem.id, { name: e.target.value })}
      />
      <input
        type="text"
        placeholder="Role / title"
        value={mem.role}
        style={{ marginTop: 6 }}
        onChange={(e) => patchMember(mem.id, { role: e.target.value })}
      />
      <textarea
        rows={3}
        placeholder="Bio or notes"
        value={mem.bio}
        style={{ marginTop: 6 }}
        onChange={(e) => patchMember(mem.id, { bio: e.target.value })}
      />
      <button
        type="button"
        className="btn btn-g btn-sm"
        style={{ marginTop: 6 }}
        onClick={() => removeMember(mem.id)}
      >
        remove
      </button>
    </div>
  );

  return (
    <>
      <div className="sbl">eyay studio</div>
      {studioMembers.map((mem) => renderCard(mem, "eyay member"))}
      <button
        type="button"
        className="btn btn-p btn-sm"
        style={{ marginBottom: 14 }}
        onClick={() => addMember("studio")}
      >
        + add eyay member
      </button>

      <div className="sbl">client side</div>
      <p
        style={{
          fontSize: 11,
          color: "var(--text3)",
          margin: "0 0 10px",
          lineHeight: 1.45,
        }}
      >
        Contacts on the client or collective side — shown in teal on the PDF so they’re
        easy to tell apart from eyay.
      </p>
      {clientMembers.map((mem) => renderCard(mem, "client contact"))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() => addMember("client")}
        style={{ borderColor: "rgba(13, 148, 136, 0.45)", color: "#5eead4" }}
      >
        + add client contact
      </button>
    </>
  );
}

function NextFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const n = proposal.nextSteps;
  return (
    <>
      {n.steps.map((step, i) => (
        <div key={i} className="ctrl">
          <label>step {i + 1}</label>
          <input
            type="text"
            value={step}
            onChange={(e) => {
              const next = [...n.steps];
              next[i] = e.target.value;
              updateActive((p) => ({
                ...p,
                nextSteps: { ...p.nextSteps, steps: next },
              }));
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ marginTop: 4 }}
            onClick={() => {
              const next = n.steps.filter((_, j) => j !== i);
              updateActive((p) => ({
                ...p,
                nextSteps: { ...p.nextSteps, steps: next },
              }));
            }}
          >
            remove step
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        style={{ marginBottom: 10 }}
        onClick={() =>
          updateActive((p) => ({
            ...p,
            nextSteps: {
              ...p.nextSteps,
              steps: [...p.nextSteps.steps, "New step"],
            },
          }))
        }
      >
        + add step
      </button>
      <div className="ctrl">
        <label>CTA</label>
        <textarea
          rows={2}
          value={n.cta}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              nextSteps: { ...p.nextSteps, cta: e.target.value },
            }))
          }
        />
      </div>
      <div className="ctrl">
        <label>calendar link (optional)</label>
        <input
          type="text"
          value={n.calLink}
          onChange={(e) =>
            updateActive((p) => ({
              ...p,
              nextSteps: { ...p.nextSteps, calLink: e.target.value },
            }))
          }
        />
      </div>
    </>
  );
}

function ProjectScopeFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const s = proposal.projectScope;
  const patch = (partial: Partial<typeof s>) =>
    updateActive((p) => ({
      ...p,
      projectScope: { ...p.projectScope, ...partial },
    }));

  const patchBullets = (
    key: "audienceItems" | "mvpItems" | "v1Items" | "outItems",
    items: ScopeBulletItem[],
  ) => patch({ [key]: items });

  return (
    <>
      <div className="sbl">product</div>
      <div className="ctrl">
        <label>title (e.g. What is …?)</label>
        <input
          type="text"
          value={s.productTitle}
          onChange={(e) => patch({ productTitle: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>body</label>
        <textarea
          rows={5}
          value={s.productBody}
          onChange={(e) => patch({ productBody: e.target.value })}
        />
      </div>

      <div className="sbl">audience</div>
      <div className="ctrl">
        <label>section title</label>
        <input
          type="text"
          value={s.audienceIntro}
          onChange={(e) => patch({ audienceIntro: e.target.value })}
        />
      </div>
      {s.audienceItems.map((it) => (
        <div key={it.id} className="ctrl" style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            style={{ flex: 1 }}
            value={it.text}
            onChange={(e) => {
              const next = s.audienceItems.map((x) =>
                x.id === it.id ? { ...x, text: e.target.value } : x,
              );
              patchBullets("audienceItems", next);
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() =>
              patchBullets(
                "audienceItems",
                s.audienceItems.filter((x) => x.id !== it.id),
              )
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patchBullets("audienceItems", [
            ...s.audienceItems,
            { id: newEntityId(), text: "" },
          ])
        }
      >
        + bullet
      </button>

      <div className="sbl">flow</div>
      <div className="ctrl">
        <label>section title</label>
        <input
          type="text"
          value={s.flowIntro}
          onChange={(e) => patch({ flowIntro: e.target.value })}
        />
      </div>
      {s.flowSteps.map((st) => (
        <div key={st.id} className="ctrl">
          <input
            type="text"
            placeholder="Step title"
            value={st.title}
            onChange={(e) => {
              const next = s.flowSteps.map((x) =>
                x.id === st.id ? { ...x, title: e.target.value } : x,
              );
              patch({ flowSteps: next });
            }}
          />
          <textarea
            rows={2}
            placeholder="Detail"
            value={st.detail}
            style={{ marginTop: 6 }}
            onChange={(e) => {
              const next = s.flowSteps.map((x) =>
                x.id === st.id ? { ...x, detail: e.target.value } : x,
              );
              patch({ flowSteps: next });
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ marginTop: 6 }}
            onClick={() =>
              patch({
                flowSteps: s.flowSteps.filter((x) => x.id !== st.id),
              })
            }
          >
            remove step
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patch({
            flowSteps: [
              ...s.flowSteps,
              { id: newEntityId(), title: "", detail: "" } satisfies FlowStepItem,
            ],
          })
        }
      >
        + flow step
      </button>

      <div className="sbl">MVP</div>
      <div className="ctrl">
        <label>title</label>
        <input
          type="text"
          value={s.mvpTitle}
          onChange={(e) => patch({ mvpTitle: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>intro</label>
        <textarea
          rows={2}
          value={s.mvpIntro}
          onChange={(e) => patch({ mvpIntro: e.target.value })}
        />
      </div>
      {s.mvpItems.map((it) => (
        <div key={it.id} className="ctrl" style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            style={{ flex: 1 }}
            value={it.text}
            onChange={(e) => {
              const next = s.mvpItems.map((x) =>
                x.id === it.id ? { ...x, text: e.target.value } : x,
              );
              patchBullets("mvpItems", next);
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() =>
              patchBullets(
                "mvpItems",
                s.mvpItems.filter((x) => x.id !== it.id),
              )
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patchBullets("mvpItems", [
            ...s.mvpItems,
            { id: newEntityId(), text: "" },
          ])
        }
      >
        + MVP bullet
      </button>

      <div className="sbl">V1 scope</div>
      <div className="ctrl">
        <label>title</label>
        <input
          type="text"
          value={s.v1Title}
          onChange={(e) => patch({ v1Title: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>intro</label>
        <textarea
          rows={2}
          value={s.v1Intro}
          onChange={(e) => patch({ v1Intro: e.target.value })}
        />
      </div>
      {s.v1Items.map((it) => (
        <div key={it.id} className="ctrl" style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            style={{ flex: 1 }}
            value={it.text}
            onChange={(e) => {
              const next = s.v1Items.map((x) =>
                x.id === it.id ? { ...x, text: e.target.value } : x,
              );
              patchBullets("v1Items", next);
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() =>
              patchBullets(
                "v1Items",
                s.v1Items.filter((x) => x.id !== it.id),
              )
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patchBullets("v1Items", [
            ...s.v1Items,
            { id: newEntityId(), text: "" },
          ])
        }
      >
        + V1 bullet
      </button>

      <div className="sbl">out of scope</div>
      <div className="ctrl">
        <label>title</label>
        <input
          type="text"
          value={s.outTitle}
          onChange={(e) => patch({ outTitle: e.target.value })}
        />
      </div>
      {s.outItems.map((it) => (
        <div key={it.id} className="ctrl" style={{ display: "flex", gap: 6 }}>
          <input
            type="text"
            style={{ flex: 1 }}
            value={it.text}
            onChange={(e) => {
              const next = s.outItems.map((x) =>
                x.id === it.id ? { ...x, text: e.target.value } : x,
              );
              patchBullets("outItems", next);
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            onClick={() =>
              patchBullets(
                "outItems",
                s.outItems.filter((x) => x.id !== it.id),
              )
            }
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patchBullets("outItems", [
            ...s.outItems,
            { id: newEntityId(), text: "" },
          ])
        }
      >
        + out-of-scope bullet
      </button>

      <div className="sbl">engagement</div>
      <div className="ctrl">
        <label>title</label>
        <input
          type="text"
          value={s.engagementTitle}
          onChange={(e) => patch({ engagementTitle: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>body</label>
        <textarea
          rows={6}
          value={s.engagementBody}
          onChange={(e) => patch({ engagementBody: e.target.value })}
        />
      </div>
    </>
  );
}

function PricingOptionsFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const o = proposal.pricingOptions;
  const patch = (partial: Partial<typeof o>) =>
    updateActive((p) => ({
      ...p,
      pricingOptions: { ...p.pricingOptions, ...partial },
    }));
  const patchRows = (rows: PricingComparisonRow[]) => patch({ rows });

  return (
    <>
      <div className="ctrl">
        <label>intro</label>
        <textarea
          rows={3}
          value={o.intro}
          onChange={(e) => patch({ intro: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>investment options</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "var(--text3)" }}>
            {o.optionBEnabled ? "Offer both options" : "Offer only option A"}
          </span>
          {o.optionBEnabled ? (
            <button
              type="button"
              className="btn btn-g btn-sm"
              onClick={() => patch({ optionBEnabled: false })}
            >
              Delete option B
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-p btn-sm"
              onClick={() => patch({ optionBEnabled: true })}
            >
              + add option B
            </button>
          )}
        </div>
      </div>
      <div className="ctrl">
        <label>option A title</label>
        <input
          type="text"
          value={o.optionATitle}
          onChange={(e) => patch({ optionATitle: e.target.value })}
        />
      </div>
      {o.optionBEnabled ? (
        <div className="ctrl">
          <label>option B title</label>
          <input
            type="text"
            value={o.optionBTitle}
            onChange={(e) => patch({ optionBTitle: e.target.value })}
          />
        </div>
      ) : null}
      <div className="ctrl">
        <label>summary A (one line)</label>
        <input
          type="text"
          value={o.summaryA}
          onChange={(e) => patch({ summaryA: e.target.value })}
        />
      </div>
      {o.optionBEnabled ? (
        <div className="ctrl">
          <label>summary B</label>
          <input
            type="text"
            value={o.summaryB}
            onChange={(e) => patch({ summaryB: e.target.value })}
          />
        </div>
      ) : null}
      <div className="sbl">comparison rows</div>
      {o.rows.map((row) => (
        <div
          key={row.id}
          className="ctrl"
          style={{
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: 8,
          }}
        >
          <input
            type="text"
            placeholder="Label"
            value={row.label}
            onChange={(e) => {
              const next = o.rows.map((x) =>
                x.id === row.id ? { ...x, label: e.target.value } : x,
              );
              patchRows(next);
            }}
          />
          <input
            type="text"
            placeholder="Option A cell"
            value={row.optionA}
            style={{ marginTop: 6 }}
            onChange={(e) => {
              const next = o.rows.map((x) =>
                x.id === row.id ? { ...x, optionA: e.target.value } : x,
              );
              patchRows(next);
            }}
          />
          {o.optionBEnabled ? (
            <input
              type="text"
              placeholder="Option B cell"
              value={row.optionB}
              style={{ marginTop: 6 }}
              onChange={(e) => {
                const next = o.rows.map((x) =>
                  x.id === row.id ? { ...x, optionB: e.target.value } : x,
                );
                patchRows(next);
              }}
            />
          ) : null}
          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ marginTop: 6 }}
            onClick={() => patchRows(o.rows.filter((x) => x.id !== row.id))}
          >
            remove row
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        style={{ marginBottom: 12 }}
        onClick={() =>
          patchRows([
            ...o.rows,
            {
              id: newEntityId(),
              label: "Row",
              optionA: "",
              optionB: "",
            },
          ])
        }
      >
        + comparison row
      </button>
      <div className="ctrl">
        <label>narrative — option A</label>
        <textarea
          rows={4}
          value={o.narrativeA}
          onChange={(e) => patch({ narrativeA: e.target.value })}
        />
      </div>
      {o.optionBEnabled ? (
        <div className="ctrl">
          <label>narrative — option B</label>
          <textarea
            rows={5}
            value={o.narrativeB}
            onChange={(e) => patch({ narrativeB: e.target.value })}
          />
        </div>
      ) : null}
      <div className="ctrl">
        <label>{o.optionBEnabled ? "both options include" : "includes"}</label>
        <textarea
          rows={3}
          value={o.bothInclude}
          onChange={(e) => patch({ bothInclude: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>
          {o.optionBEnabled ? "not included (either option)" : "not included"}
        </label>
        <textarea
          rows={3}
          value={o.notIncluded}
          onChange={(e) => patch({ notIncluded: e.target.value })}
        />
      </div>
      <div className="ctrl">
        <label>payment terms</label>
        <textarea
          rows={3}
          value={o.paymentTerms}
          onChange={(e) => patch({ paymentTerms: e.target.value })}
        />
      </div>
    </>
  );
}

function DecisionsFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  const d = proposal.decisions;
  const patch = (partial: Partial<typeof d>) =>
    updateActive((p) => ({
      ...p,
      decisions: { ...p.decisions, ...partial },
    }));

  return (
    <>
      <div className="ctrl">
        <label>intro</label>
        <textarea
          rows={2}
          value={d.intro}
          onChange={(e) => patch({ intro: e.target.value })}
        />
      </div>
      {d.items.map((it, i) => (
        <div key={it.id} className="ctrl">
          <label>decision {i + 1}</label>
          <textarea
            rows={2}
            value={it.text}
            onChange={(e) => {
              const next = d.items.map((x) =>
                x.id === it.id ? { ...x, text: e.target.value } : x,
              );
              patch({ items: next });
            }}
          />
          <button
            type="button"
            className="btn btn-g btn-sm"
            style={{ marginTop: 6 }}
            onClick={() =>
              patch({ items: d.items.filter((x) => x.id !== it.id) })
            }
          >
            remove
          </button>
        </div>
      ))}
      <button
        type="button"
        className="btn btn-g btn-sm"
        onClick={() =>
          patch({
            items: [...d.items, { id: newEntityId(), text: "" }],
          })
        }
      >
        + decision
      </button>
    </>
  );
}

function TermsFields({
  proposal,
  updateActive,
}: {
  proposal: Proposal;
  updateActive: ProposalEditorProps["updateActive"];
}) {
  return (
    <div className="ctrl">
      <label>terms (plain text)</label>
      <textarea
        rows={10}
        value={proposal.terms}
        onChange={(e) =>
          updateActive((p) => ({ ...p, terms: e.target.value }))
        }
      />
    </div>
  );
}

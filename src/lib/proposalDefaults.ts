import type {
  DeliverableItem,
  FlowStepItem,
  InvestmentLineItem,
  PricingComparisonRow,
  Proposal,
  ProposalMeta,
  ProposalSection,
  ScopeBulletItem,
  SectionType,
  TeamMember,
  TimelinePhase,
} from "./proposalTypes";

/** Canonical order for sections in the PDF and merge template */
export const PROPOSAL_SECTION_ORDER: SectionType[] = [
  "cover",
  "about",
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

export function newEntityId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** YYYY-NNN, incremented per browser session */
export function nextProposalNumber(): string {
  if (typeof sessionStorage === "undefined") {
    const y = new Date().getFullYear();
    return `${y}-001`;
  }
  const y = new Date().getFullYear();
  const key = `eyay-proposal-seq-${y}`;
  const prev = parseInt(sessionStorage.getItem(key) ?? "0", 10);
  const next = prev + 1;
  sessionStorage.setItem(key, String(next));
  return `${y}-${String(next).padStart(3, "0")}`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function defaultMeta(): ProposalMeta {
  const today = new Date();
  const valid = new Date(today);
  valid.setDate(valid.getDate() + 30);
  return {
    clientName: "",
    clientContact: "",
    projectName: "",
    proposalDate: isoDate(today),
    proposalNumber: nextProposalNumber(),
    validUntil: isoDate(valid),
    studioContact: "Ayu Koene",
    studioEmail: "hello@eyay.studio",
    studioAddress: "Amsterdam · Netherlands",
    preparedBy: "eyay studio",
    proposalStatus: "Awaiting approval",
  };
}

function defaultSections(): ProposalSection[] {
  const disabled: SectionType[] = ["terms", "investment", "deliverables"];
  return PROPOSAL_SECTION_ORDER.map((type, i) => ({
    id: `${type}-${i}`,
    type,
    enabled: !disabled.includes(type),
    order: i,
  }));
}

const defaultDeliverableItems: DeliverableItem[] = [
  {
    id: newEntityId(),
    label: "Discovery workshop & scope alignment",
    included: true,
  },
  {
    id: newEntityId(),
    label: "UX/UI design and clickable prototype",
    included: true,
  },
  {
    id: newEntityId(),
    label: "Production build and launch support",
    included: true,
  },
];

const defaultTimelinePhases: TimelinePhase[] = [
  {
    id: newEntityId(),
    name: "Collective reviews proposal",
    duration: "Week 0",
    description:
      "Confirm engagement model, pricing tier, and scope. Name a project group and billing owner.",
  },
  {
    id: newEntityId(),
    name: "V1 development",
    duration: "Build phase",
    description:
      "eyay ships V1 as scoped — structured pilots, iteration rounds, and launch support per your tier.",
  },
  {
    id: newEntityId(),
    name: "Launch & retainer",
    duration: "Post V1",
    description:
      "Retainer starts at V1 delivery: hosting, stability, and (on Launch Partner) one small improvement per month.",
  },
];

const defaultPricingRows: PricingComparisonRow[] = [
  {
    id: newEntityId(),
    label: "V1 build",
    optionA: "€3.000",
    optionB: "€5.000",
  },
  {
    id: newEntityId(),
    label: "Monthly",
    optionA: "€50",
    optionB: "€100",
  },
  {
    id: newEntityId(),
    label: "Branding",
    optionA: "eyay defaults",
    optionB: "Collective branding",
  },
  {
    id: newEntityId(),
    label: "Pilots",
    optionA: "Self-run",
    optionB: "4 guided pilots",
  },
  {
    id: newEntityId(),
    label: "Iteration rounds",
    optionA: "1",
    optionB: "2",
  },
  {
    id: newEntityId(),
    label: "Host onboarding",
    optionA: "Checklist PDF",
    optionB: "Live group session (45 min, up to 40)",
  },
  {
    id: newEntityId(),
    label: "Facilitator toolkit",
    optionA: "Basic checklist",
    optionB: "Full guide + templates",
  },
  {
    id: newEntityId(),
    label: "Monthly retainer includes",
    optionA: "Hosting + bug fixes",
    optionB: "+ 1 small improvement / month",
  },
];

function defaultProjectScope() {
  const bullet = (text: string): ScopeBulletItem => ({
    id: newEntityId(),
    text,
  });
  const step = (title: string, detail: string): FlowStepItem => ({
    id: newEntityId(),
    title,
    detail,
  });

  return {
    productTitle: "What is this product?",
    productBody:
      "A session-based web app that turns your physical workflow into a digital experience for online and hybrid meetings.\n\nA host runs a session; participants join with a code. The product produces real, exportable outputs after each session — so hosts have something tangible to share with clients and teams, not just a one-off moment.",
    audienceIntro: "Who it’s for",
    audienceItems: [
      bullet("Licensed hosts: run sessions in client and team settings."),
      bullet("Participants: join with a link or code — no account required."),
    ],
    flowIntro: "Typical session flow",
    flowSteps: [
      step("Host creates a session", "Share code or link with participants."),
      step("Participants join", "Name entry and lobby → live session."),
      step("Guided activity", "Timed rounds, shared state, clear facilitator cues."),
      step("Outputs", "Recap, export, or share — format to be defined in V1."),
    ],
    mvpTitle: "Current state (demo / MVP)",
    mvpIntro: "What already exists and has been demonstrated:",
    mvpItems: [
      bullet("Core session lifecycle (create → join → run → end)"),
      bullet("Live shared state for participants"),
      bullet("Baseline facilitator flow"),
    ],
    v1Title: "V1 scope",
    v1Intro: "To move from demo to something you can run with real clients:",
    v1Items: [
      bullet(
        "Licensed hosting — only approved members can host; collective manages the host list.",
      ),
      bullet(
        "Session data & export — structured recap after each session; export options (e.g. PDF, copy). Retention policy agreed with you.",
      ),
      bullet(
        "Privacy & consent — clear consent before sensitive capture; host toggles per session where applicable.",
      ),
      bullet(
        "Reliability — reconnects, late joiners, refresh recovery, stable under real meeting conditions.",
      ),
      bullet(
        "Facilitator controls — start/stop, timers, queue order, skip where needed.",
      ),
      bullet(
        "Pilot readiness — facilitator script, checklist, and feedback capture (depth depends on tier).",
      ),
    ],
    outTitle: "Out of scope for V1",
    outItems: [
      bullet("Long-term analytics or cross-session trend dashboards"),
      bullet("Video-platform marketplace listings (Zoom / Teams apps)"),
      bullet("Major new features quoted separately"),
    ],
    engagementTitle: "Engagement model",
    engagementBody:
      "The product is built and maintained by eyay studio. The product, codebase, and IP remain with eyay. You license use for your members.\n\n• eyay develops, hosts, and maintains the platform.\n• You get access under a license agreement.\n• eyay may offer the platform (or derivatives) to other clients independently unless otherwise agreed in writing.",
  };
}

function defaultPricingOptions() {
  return {
    intro:
      "Option A is deliberately lean. Option B — Launch Partner — is for when you need adoption across many hosts: eyay stays invested in onboarding, pilots, and iteration so the product doesn’t sit unused.",
    optionATitle: "Option A — Lean",
    optionBTitle: "Option B — Launch Partner",
    summaryA: "€3.000 one-time + €50/month",
    summaryB: "€5.000 one-time + €100/month",
    rows: defaultPricingRows.map((r) => ({ ...r, id: newEntityId() })),
    narrativeA:
      "eyay delivers V1 as scoped. One feedback round included. You run your own pilots — we fix bugs that surface but we’re not facilitating or coordinating pilot sessions.\n\n• One-time V1 build: €3.000\n• Monthly: €50 (hosting, infrastructure, bug fixes)",
    narrativeB:
      "eyay delivers V1 and stays in the launch: collective branding on session surfaces, four structured pilots with feedback templates, two iteration rounds (after pilots 1–2 and 3–4), a live 45-minute onboarding for up to 40 hosts, and a full facilitator toolkit (script, timings, hybrid/remote tips, first-session email template).\n\n• One-time V1 build: €5.000\n• Monthly: €100 — everything in Lean, plus one small improvement per month (UI tweak, copy change, etc.), not just bug fixes.",
    bothInclude:
      "• Platform access for licensed hosts (up to 40)\n• Hosting, realtime infrastructure, and model/API costs as scoped\n• Bug fixes and stability maintenance",
    notIncluded:
      "• Major new features or integrations (scoped and quoted separately)\n• Custom one-off development per individual member\n• Third-party integrations unless explicitly scoped",
    paymentTerms:
      "V1: 50% upfront at project start, 50% at V1 delivery. Monthly retainer starts when V1 ships. 3-month notice to cancel retainer (either party). All prices excl. 21% VAT.",
  };
}

function defaultDecisions(): { intro: string; items: ScopeBulletItem[] } {
  return {
    intro: "What we need confirmed:",
    items: [
      {
        id: newEntityId(),
        text: "Approve this proposal — engagement model, tier, and scope — or come back with questions.",
      },
      {
        id: newEntityId(),
        text: "Member management: who owns the licensed host list (add/remove)?",
      },
      {
        id: newEntityId(),
        text: "Project group: 2–3 people for use cases and pilots; one decision-maker for scope.",
      },
      {
        id: newEntityId(),
        text: "Data retention: how long to keep session data by default? (We often suggest auto-delete after 90 days unless the host saves.)",
      },
      {
        id: newEntityId(),
        text: "Billing: which entity or person owns the license invoice?",
      },
    ],
  };
}

const defaultInvestmentItems: InvestmentLineItem[] = [
  {
    id: newEntityId(),
    label: "Design Sprint",
    description: "Research to prototype. No deck, no fluff.",
    price: 12000,
    unit: "fixed",
    quantity: 1,
    included: true,
  },
  {
    id: newEntityId(),
    label: "Build & Launch",
    description: "Full product, end to end.",
    price: 0,
    unit: "fixed",
    quantity: 1,
    included: false,
  },
  {
    id: newEntityId(),
    label: "AI Feature",
    description: "One real AI feature. Scoped tight.",
    price: 7500,
    unit: "fixed",
    quantity: 1,
    included: false,
  },
  {
    id: newEntityId(),
    label: "Retainer",
    description: "Ongoing senior support.",
    price: 4000,
    unit: "monthly",
    quantity: 1,
    included: false,
  },
];

export function createDefaultProposal(): Proposal {
  const d = defaultDecisions();
  return {
    id: newEntityId(),
    meta: defaultMeta(),
    theme: "dark",
    sections: defaultSections(),
    about: {
      context:
        "You’re moving from a proven physical or manual workflow to something members can run digitally — with real outputs after each session.",
      problem:
        "The risk isn’t only building V1 — it’s adoption. Without onboarding, pilots, and iteration, the product can sit unused.",
      approach:
        "We scope V1 honestly, offer a lean tier and a Launch Partner tier with a clear delta (branding, pilots, live onboarding, toolkit, retainer improvements), and keep IP/hosting responsibilities explicit.",
    },
    projectScope: defaultProjectScope(),
    deliverables: {
      intro:
        "Use this list for a short executive summary; full detail lives in Project scope.",
      items: defaultDeliverableItems.map((x) => ({ ...x, id: newEntityId() })),
    },
    howWeWork: {
      pillars: [
        {
          tag: "AI-Native Workflow",
          headline: "You get more, faster.",
          desc: "AI runs through every stage of how we work — research, design, and build — so we spend time on judgment, taste, and the details that matter.",
        },
        {
          tag: "End-to-End Ownership",
          headline: "One team, start to finish.",
          desc: "We don't hand off PDFs or throw designs over the wall. The same people who frame the problem ship the product.",
        },
        {
          tag: "Cutting-Edge Stack",
          headline: "Built to last, not to impress.",
          desc: "Modern stack, clean code, and pragmatic architecture — so what we ship stays maintainable after we’re gone.",
        },
      ],
    },
    timeline: {
      phases: defaultTimelinePhases.map((p) => ({ ...p, id: newEntityId() })),
      startNote: "",
    },
    pricingOptions: defaultPricingOptions(),
    investment: {
      items: defaultInvestmentItems.map((i) => ({ ...i, id: newEntityId() })),
      vatNote: "All prices excl. 21% VAT",
      paymentTerms: "50% upfront, 50% on delivery",
    },
    team: {
      members: [
        {
          id: newEntityId(),
          name: "Ayu Koene",
          role: "Design & Strategy",
          bio: "I translate messy briefs into clear product decisions — and make sure what we build actually looks and feels right.",
          side: "studio",
        },
        {
          id: newEntityId(),
          name: "Sinyo Koene",
          role: "Development & AI",
          bio: "I build the thing. Full-stack, AI-integrated, fast. If it can be automated, I want to know about it.",
          side: "studio",
        },
      ],
    },
    decisions: { intro: d.intro, items: d.items },
    nextSteps: {
      steps: [
        "You review and accept this proposal (or send questions)",
        "We form the project group and confirm billing + host-list owner",
        "eyay begins V1 development",
        "Pilots and iteration per your tier",
        "V1 delivered — retainer starts",
      ],
      cta: "Reply to confirm your tier and we’ll send contract + first invoice.",
      calLink: "",
    },
    terms: "",
  };
}

export function normalizeTeamMembers(
  members: unknown[] | undefined,
  fallback: TeamMember[],
): TeamMember[] {
  if (members === undefined) return fallback;
  if (members.length === 0) return [];
  return members.map((raw) => {
    const m = raw as Partial<TeamMember>;
    return {
      id: typeof m.id === "string" && m.id ? m.id : newEntityId(),
      name: m.name ?? "",
      role: m.role ?? "",
      bio: m.bio ?? "",
      side: m.side === "client" ? "client" : "studio",
    };
  });
}

function mergeSections(
  existing: ProposalSection[] | undefined,
  template: ProposalSection[],
): ProposalSection[] {
  if (!existing?.length) return template;
  const byType = new Map(existing.map((s) => [s.type, s]));
  return template.map((t) => {
    const cur = byType.get(t.type);
    if (!cur) return t;
    return { ...t, ...cur, type: t.type, id: cur.id, order: t.order };
  });
}

let mergeDefaultsCache: Proposal | null = null;

function getDefaultsForMerge(): Proposal {
  if (!mergeDefaultsCache) {
    mergeDefaultsCache = createDefaultProposal();
  }
  return mergeDefaultsCache;
}

/** Hydrate proposals saved before new fields / sections existed */
export function mergeLoadedProposal(raw: unknown): Proposal {
  const d = getDefaultsForMerge();
  if (!raw || typeof raw !== "object") return createDefaultProposal();
  const p = raw as Proposal;

  const po = p.pricingOptions
    ? {
        ...d.pricingOptions,
        ...p.pricingOptions,
        rows:
          p.pricingOptions.rows?.length > 0
            ? p.pricingOptions.rows
            : d.pricingOptions.rows,
      }
    : d.pricingOptions;

  const ps = p.projectScope
    ? {
        ...d.projectScope,
        ...p.projectScope,
        audienceItems:
          p.projectScope.audienceItems?.length > 0
            ? p.projectScope.audienceItems
            : d.projectScope.audienceItems,
        flowSteps:
          p.projectScope.flowSteps?.length > 0
            ? p.projectScope.flowSteps
            : d.projectScope.flowSteps,
        mvpItems:
          p.projectScope.mvpItems?.length > 0
            ? p.projectScope.mvpItems
            : d.projectScope.mvpItems,
        v1Items:
          p.projectScope.v1Items?.length > 0
            ? p.projectScope.v1Items
            : d.projectScope.v1Items,
        outItems:
          p.projectScope.outItems?.length > 0
            ? p.projectScope.outItems
            : d.projectScope.outItems,
      }
    : d.projectScope;

  const dec = p.decisions
    ? {
        ...d.decisions,
        ...p.decisions,
        items:
          p.decisions.items?.length > 0
            ? p.decisions.items
            : d.decisions.items,
      }
    : d.decisions;

  return {
    ...d,
    ...p,
    id: typeof p.id === "string" && p.id ? p.id : d.id,
    meta: {
      ...d.meta,
      ...p.meta,
      studioAddress: p.meta?.studioAddress ?? d.meta.studioAddress,
      preparedBy: p.meta?.preparedBy ?? d.meta.preparedBy,
      proposalStatus: p.meta?.proposalStatus ?? d.meta.proposalStatus,
    },
    sections: mergeSections(p.sections, d.sections),
    about: { ...d.about, ...p.about },
    projectScope: ps,
    deliverables: {
      ...d.deliverables,
      ...p.deliverables,
      items:
        p.deliverables?.items?.length > 0
          ? p.deliverables.items
          : d.deliverables.items,
    },
    howWeWork: {
      ...d.howWeWork,
      ...p.howWeWork,
      pillars:
        p.howWeWork?.pillars?.length > 0
          ? p.howWeWork.pillars
          : d.howWeWork.pillars,
    },
    timeline: {
      ...d.timeline,
      ...p.timeline,
      phases:
        p.timeline?.phases?.length > 0
          ? p.timeline.phases
          : d.timeline.phases,
    },
    pricingOptions: po,
    investment: {
      ...d.investment,
      ...p.investment,
      items:
        p.investment?.items?.length > 0
          ? p.investment.items
          : d.investment.items,
    },
    team: {
      ...d.team,
      ...p.team,
      members: normalizeTeamMembers(
        p.team?.members,
        d.team.members,
      ),
    },
    decisions: dec,
    nextSteps: { ...d.nextSteps, ...p.nextSteps },
    terms: p.terms ?? d.terms,
  };
}

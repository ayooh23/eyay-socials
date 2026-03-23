export type ProposalTheme = "dark" | "light" | "cream";

export interface ProposalMeta {
  clientName: string;
  clientContact: string;
  projectName: string;
  proposalDate: string;
  proposalNumber: string;
  validUntil: string;
  studioContact: string;
  studioEmail: string;
  /** Shown on cover footer */
  studioAddress: string;
  /** Cover: “Prepared by” (e.g. eyay studio) */
  preparedBy: string;
  /** Cover: status line (e.g. Awaiting approval) */
  proposalStatus: string;
}

export interface ProposalSection {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
}

export type SectionType =
  | "cover"
  | "about"
  | "about-eya"
  | "project-scope"
  | "deliverables"
  | "how-we-work"
  | "timeline"
  | "pricing-options"
  | "investment"
  | "team"
  | "decisions"
  | "next-steps"
  | "terms";

export interface AboutSection {
  context: string;
  problem: string;
  approach: string;
}

export interface EyaAboutSection {
  /** Big headline at the top of the page */
  headline: string;
  /** Body text shown below the headline */
  body: string;
}

export interface DeliverablesSection {
  intro: string;
  items: DeliverableItem[];
}

export interface DeliverableItem {
  id: string;
  label: string;
  included: boolean;
}

export interface TimelinePhase {
  id: string;
  name: string;
  duration: string;
  description: string;
}

export interface TimelineSection {
  phases: TimelinePhase[];
  startNote: string;
}

export interface InvestmentLineItem {
  id: string;
  label: string;
  description: string;
  price: number;
  unit: "fixed" | "monthly" | "daily";
  quantity: number;
  included: boolean;
}

export interface InvestmentSection {
  items: InvestmentLineItem[];
  vatNote: string;
  paymentTerms: string;
}

export type TeamMemberSide = "studio" | "client";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  /** eyay team vs client / collective contacts */
  side: TeamMemberSide;
}

export interface TeamSection {
  members: TeamMember[];
}

export interface NextStepsSection {
  steps: string[];
  cta: string;
  calLink: string;
}

export interface HowWeWorkSection {
  pillars: { tag: string; headline: string; desc: string }[];
}

export interface ScopeBulletItem {
  id: string;
  text: string;
}

export interface FlowStepItem {
  id: string;
  title: string;
  detail: string;
}

/** Product / engagement proposals — scope, MVP, V1, out of scope (see e.g. licensed product briefs) */
export interface ProjectScopeSection {
  productTitle: string;
  productBody: string;
  audienceIntro: string;
  audienceItems: ScopeBulletItem[];
  flowIntro: string;
  flowSteps: FlowStepItem[];
  mvpTitle: string;
  mvpIntro: string;
  mvpItems: ScopeBulletItem[];
  v1Title: string;
  v1Intro: string;
  v1Items: ScopeBulletItem[];
  outTitle: string;
  outItems: ScopeBulletItem[];
  engagementTitle: string;
  engagementBody: string;
}

export interface PricingComparisonRow {
  id: string;
  label: string;
  optionA: string;
  optionB: string;
}

/** Two-option pricing (Lean vs Launch Partner, etc.) */
export interface PricingOptionsSection {
  intro: string;
  optionATitle: string;
  optionBTitle: string;
  summaryA: string;
  summaryB: string;
  /**
   * Whether option B is offered.
   * When false, the proposal renders as a single investment option (option A only).
   */
  optionBEnabled: boolean;
  rows: PricingComparisonRow[];
  narrativeA: string;
  narrativeB: string;
  bothInclude: string;
  notIncluded: string;
  paymentTerms: string;
}

export interface DecisionsSection {
  intro: string;
  items: ScopeBulletItem[];
}

/** One render unit inside a project-scope PDF page */
export type ScopeRenderBlock =
  | { kind: "product"; title: string; body: string }
  | { kind: "bullets"; title: string; intro: string; items: string[] }
  | {
      kind: "flow";
      title: string;
      intro: string;
      steps: { title: string; detail: string }[];
    };

export interface Proposal {
  id: string;
  meta: ProposalMeta;
  theme: ProposalTheme;
  sections: ProposalSection[];
  about: AboutSection;
  eyaAbout: EyaAboutSection;
  projectScope: ProjectScopeSection;
  deliverables: DeliverablesSection;
  howWeWork: HowWeWorkSection;
  timeline: TimelineSection;
  pricingOptions: PricingOptionsSection;
  investment: InvestmentSection;
  team: TeamSection;
  decisions: DecisionsSection;
  nextSteps: NextStepsSection;
  terms: string;
}

export interface ProposalsStorageState {
  proposals: Proposal[];
  activeId: string;
}

/** One printable A4 page */
export type ProposalPageModel =
  | { key: string; kind: "cover" }
  | {
      key: string;
      kind: "section";
      sectionType: SectionType;
      title: string;
      continuation: boolean;
      /** Section-specific payload for this page */
      payload: SectionPagePayload;
    };

export type SectionPagePayload =
  | { type: "about"; paragraphs: string[] }
  | { type: "about-eya"; headline: string; paragraphs: string[]; showHeadline: boolean }
  | { type: "project-scope"; blocks: ScopeRenderBlock[] }
  | {
      type: "deliverables";
      intro: string;
      items: DeliverableItem[];
    }
  | { type: "how-we-work"; pillars: HowWeWorkSection["pillars"] }
  | { type: "timeline"; phases: TimelinePhase[]; startNote: string }
  | {
      type: "pricing-options";
      slice: "compare" | "detail";
      data: PricingOptionsSection;
    }
  | { type: "investment"; items: InvestmentLineItem[]; vatNote: string; paymentTerms: string }
  | { type: "team"; members: TeamMember[] }
  | { type: "decisions"; paragraphs: string[] }
  | { type: "next-steps"; steps: string[]; cta: string; calLink: string }
  | { type: "terms"; text: string };

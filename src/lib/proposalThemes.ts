import type { ProposalTheme } from "./proposalTypes";

/** Cover page is always eyay blue + white type (not tied to document theme) */
export const PROPOSAL_COVER_STYLES = {
  bg: "#0000FF",
  text: "#ffffff",
  muted: "rgba(255,255,255,0.55)",
  rule: "rgba(255,255,255,0.9)",
  footer: "rgba(255,255,255,0.45)",
} as const;

export interface ProposalThemeTokens {
  bg: string;
  text: string;
  muted: string;
  accent: string;
  surface: string;
  border: string;
}

/** Investment (pricing options): eyay blue field + white type */
export const PROPOSAL_PRICING_OPTIONS_THEME: ProposalThemeTokens = {
  bg: "#0000FF",
  text: "#ffffff",
  muted: "rgba(255,255,255,.55)",
  accent: "#ffffff",
  surface: "rgba(255,255,255,.1)",
  border: "rgba(255,255,255,.2)",
};

/** eyay pricelist (line items): black field + white type */
export const PROPOSAL_PRICELIST_THEME: ProposalThemeTokens = {
  bg: "#000000",
  text: "#ffffff",
  muted: "rgba(255,255,255,.44)",
  accent: "#0000FF",
  surface: "#0a0a0a",
  border: "rgba(255,255,255,.08)",
};

/** Terms: same black field + white type as pricelist */
export const PROPOSAL_TERMS_THEME = PROPOSAL_PRICELIST_THEME;

export const PROPOSAL_THEMES: Record<ProposalTheme, ProposalThemeTokens> = {
  dark: {
    bg: "#0a0a0a",
    text: "#ffffff",
    muted: "rgba(255,255,255,.44)",
    accent: "#0000FF",
    surface: "#111111",
    border: "rgba(255,255,255,.08)",
  },
  light: {
    bg: "#ffffff",
    text: "#0a0a0a",
    muted: "rgba(0,0,0,.44)",
    accent: "#0000FF",
    surface: "#f5f5f5",
    border: "rgba(0,0,0,.08)",
  },
  cream: {
    bg: "#faf8f4",
    text: "#1a1a1a",
    muted: "rgba(0,0,0,.4)",
    accent: "#0000FF",
    surface: "#f0ece4",
    border: "rgba(0,0,0,.07)",
  },
};

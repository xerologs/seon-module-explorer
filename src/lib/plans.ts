// Plan + tier configuration. Single source of truth — used by server (limits)
// and UI (pricing table, modals, dashboard).

export type Tier = "Guest" | "Basic" | "Investigator" | "Lifetime";
export type Role = "user" | "support" | "admin" | "master_admin";

export interface PlanDef {
  tier: Tier;
  name: string;
  price: string;
  cadence: string;
  dailyLimit: number; // 0 = no access (Guest), Infinity = unlimited
  blurb: string;
  features: string[];
  highlight?: boolean;
}

export const PLANS: Record<Tier, PlanDef> = {
  Guest: {
    tier: "Guest",
    name: "Free",
    price: "$0",
    cadence: "/forever",
    dailyLimit: 0,
    blurb: "Browse the catalog. Upgrade to unlock lookups.",
    features: [
      "View module catalog",
      "Create investigations/cases",
      "Community support",
      "Upgrade to run lookups",
    ],
  },
  Basic: {
    tier: "Basic",
    name: "Basic",
    price: "$15",
    cadence: "/month",
    dailyLimit: 100,
    blurb: "Daily-driver for solo analysts.",
    features: [
      "100 requests / 24h",
      "Basic Modules - Breach + Discord + Social + IP + Many More ",
      "create Investigation/cases",
      "support",
    ],
  },
  Investigator: {
    tier: "Investigator",
    name: "Investigator",
    price: "$30",
    cadence: "/month",
    dailyLimit: 500,
    blurb: "Power tier for serious operators.",
    features: [
      "500 requests / 24h",
      "All Basic modules + Premium Modules",
      "SkidGraph",
      "Priority support",
    ],
    highlight: true,
  },
  Lifetime: {
    tier: "Lifetime",
    name: "Lifetime",
    price: "$65",
    cadence: "/one-time",
    dailyLimit: 2000,
    blurb: "Pay once. Hammer it forever.",
    features: [
      "2,000 requests / 24h",
      "Everything In Investigator",
      "Lifetime access",
      "Priority support",
    ],
  },
};

export const TIER_ORDER: Tier[] = ["Guest", "Basic", "Investigator", "Lifetime"];

export function tierRank(t: Tier): number {
  return TIER_ORDER.indexOf(t);
}

export function planLimit(tier: Tier): number {
  return PLANS[tier].dailyLimit;
}

export const RESET_WINDOW_MS = 24 * 60 * 60 * 1000;

export const TELEGRAM_HANDLE = "@breachcheck";

import type { Tier } from "./plans";
import geointImg from "@/assets/module-geoint.jpg";
import facescanImg from "@/assets/module-facescan.jpg";

export type ModuleCategory =
  | "Breach" | "Discord" | "Gaming" | "Social"
  | "IP" | "Identity" | "Location" | "Face";

/**
 * Per-module provider config. Each provider has its own HTTP shape, auth header,
 * and parameter convention. The executor in `dashboard.functions.ts` switches on
 * `provider.kind` to dispatch the upstream call.
 */
export type ProviderConfig =
  // Legacy OATH.NET multiplexer (existing modules)
  | { kind: "oathnet"; endpoint: string; param: string }
  // Shodan
  | { kind: "shodan-host" }
  | { kind: "shodan-search" }
  | { kind: "shodan-dns-resolve" }
  | { kind: "shodan-dns-domain" }
  // LeakCheck
  | { kind: "leakcheck-public" }
  | { kind: "leakcheck-pro"; type: "auto" | "email" | "username" | "domain" | "phone" | "hash" }
  // SEON
  | { kind: "seon-email" }
  | { kind: "seon-phone" }
  | { kind: "seon-ip" }
  // TgScan
  | { kind: "tgscan" }
  // OSINT.Industries
  | { kind: "osintindustries"; type: "email" | "phone" | "username" }
  // Generic public-GET provider. `{q}` in urlTemplate is replaced with URL-encoded query.
  | { kind: "public-get"; urlTemplate: string; headers?: Record<string, string> }
  // Placeholder for un-shipped modules
  | { kind: "coming-soon" };

export interface ModuleDef {
  slug: string;
  name: string;
  category: ModuleCategory;
  description: string;
  inputLabel: string;
  inputPlaceholder: string;
  minTier: Tier;
  provider: ProviderConfig;
  /** When true the module is rendered as locked "Coming soon" and cannot be executed. */
  comingSoon?: boolean;
  /** Optional banner image rendered at the top of the module card. */
  image?: string;
}

export const MODULES: ModuleDef[] = [
  // Breach
  { slug: "v2-breach-search", name: "Breach Search v2", category: "Breach",
    description: "Hunt credentials across breach corpora.",
    inputLabel: "Email / username", inputPlaceholder: "target@example.com",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/v2/breach/search", param: "q" } },
  { slug: "v2-stealer-search", name: "Stealer Logs v2", category: "Breach",
    description: "Search infostealer log dumps for the target.",
    inputLabel: "Email / username", inputPlaceholder: "target@example.com",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/v2/stealer/search", param: "q" } },

  // Breach — LeakCheck
  { slug: "leakcheck-public", name: "LeakCheck Public",  category: "Breach",
    description: "Free LeakCheck lookup. Returns breach hits without password material.",
    inputLabel: "Email / username / phone / domain / hash", inputPlaceholder: "target@example.com",
    minTier: "Basic",
    provider: { kind: "leakcheck-public" }, comingSoon: true },
  { slug: "leakcheck-pro-email", name: "LeakCheck Pro — Email", category: "Breach",
    description: "Authenticated LeakCheck v2 lookup by email. Returns source, fields and (plan-permitting) passwords.",
    inputLabel: "Email", inputPlaceholder: "target@example.com",
    minTier: "Investigator",
    provider: { kind: "leakcheck-pro", type: "email" }, comingSoon: true },
  { slug: "leakcheck-pro-username", name: "LeakCheck Pro — Username", category: "Breach",
    description: "Authenticated LeakCheck v2 lookup by username.",
    inputLabel: "Username", inputPlaceholder: "targetuser",
    minTier: "Investigator",
    provider: { kind: "leakcheck-pro", type: "username" }, comingSoon: true },
  { slug: "leakcheck-pro-domain", name: "LeakCheck Pro — Domain", category: "Breach",
    description: "Authenticated LeakCheck v2 lookup for an entire domain.",
    inputLabel: "Domain", inputPlaceholder: "example.com",
    minTier: "Investigator",
    provider: { kind: "leakcheck-pro", type: "domain" }, comingSoon: true },
  { slug: "leakcheck-pro-phone", name: "LeakCheck Pro — Phone", category: "Breach",
    description: "Authenticated LeakCheck v2 lookup by phone number (E.164).",
    inputLabel: "Phone (E.164)", inputPlaceholder: "+14155551234",
    minTier: "Investigator",
    provider: { kind: "leakcheck-pro", type: "phone" }, comingSoon: true },
  { slug: "leakcheck-pro-hash", name: "LeakCheck Pro — Hash", category: "Breach",
    description: "Authenticated LeakCheck v2 lookup by SHA-256 / MD5 / SHA-1 hash.",
    inputLabel: "Hash", inputPlaceholder: "5e884898da28047151d0e56f8dc6292773603d0d…",
    minTier: "Investigator",
    provider: { kind: "leakcheck-pro", type: "hash" }, comingSoon: true },

  // Discord
  { slug: "discord-userinfo", name: "Discord UserInfo", category: "Discord",
    description: "Resolve a Discord ID to profile metadata.",
    inputLabel: "Discord user ID", inputPlaceholder: "123456789012345678",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/discord-userinfo", param: "discord_id" } },
  { slug: "discord-username-history", name: "Username History", category: "Discord",
    description: "Track username changes for a Discord account.",
    inputLabel: "Discord user ID", inputPlaceholder: "123456789012345678",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/discord-username-history", param: "discord_id" } },
  { slug: "discord-to-roblox", name: "Discord → Roblox", category: "Discord",
    description: "Pivot a Discord account to a linked Roblox profile.",
    inputLabel: "Discord user ID", inputPlaceholder: "123456789012345678",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/discord-to-roblox", param: "discord_id" } },

  // Gaming
  { slug: "steam", name: "Steam Profile", category: "Gaming",
    description: "Pull Steam profile + game metadata.",
    inputLabel: "Steam ID", inputPlaceholder: "76561198000000000",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/steam", param: "steam_id" } },
  { slug: "xbox", name: "Xbox Gamertag", category: "Gaming",
    description: "Resolve an Xbox gamertag and presence.",
    inputLabel: "XBL ID / gamertag", inputPlaceholder: "MajorNelson",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/xbox", param: "xbl_id" } },
  { slug: "roblox-userinfo", name: "Roblox UserInfo", category: "Gaming",
    description: "Pull Roblox profile + asset metadata.",
    inputLabel: "Roblox username", inputPlaceholder: "Builderman",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/roblox-userinfo", param: "username" } },
  { slug: "mc-history", name: "Minecraft History", category: "Gaming",
    description: "Name history for a Minecraft account.",
    inputLabel: "Minecraft username", inputPlaceholder: "Notch",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/mc-history", param: "username" } },

  // Social — TgScan (Telegram)
  { slug: "tgscan-search", name: "Telegram Groups (TgScan)", category: "Social",
    description: "List public Telegram groups/channels a user belongs to. Input: @username or numeric ID.",
    inputLabel: "Telegram username or numeric ID", inputPlaceholder: "durov",
    minTier: "Basic",
    provider: { kind: "tgscan" }, comingSoon: true },

  // IP
  { slug: "ip-info", name: "IP Intelligence", category: "IP",
    description: "Geo, ASN, and reputation for an IP.",
    inputLabel: "IPv4 / IPv6", inputPlaceholder: "1.1.1.1",
    minTier: "Basic",
    provider: { kind: "oathnet", endpoint: "/ip-info", param: "ip" } },

  // IP — Shodan
  { slug: "shodan-host", name: "Shodan Host", category: "IP",
    description: "Open ports, banners, services, vulns, ASN and geo for an IP.",
    inputLabel: "IPv4 / IPv6", inputPlaceholder: "1.1.1.1",
    minTier: "Basic",
    provider: { kind: "shodan-host" } },
  { slug: "shodan-search", name: "Shodan Search", category: "IP",
    description: "Search Shodan's banner index. Supports filters like port:, org:, country:, product:.",
    inputLabel: "Shodan query", inputPlaceholder: "apache country:US port:80",
    minTier: "Investigator",
    provider: { kind: "shodan-search" } },
  { slug: "shodan-dns-resolve", name: "Shodan DNS Resolve", category: "IP",
    description: "Resolve one or more hostnames to IPs via Shodan's DNS index.",
    inputLabel: "Hostname(s), comma-separated", inputPlaceholder: "google.com,facebook.com",
    minTier: "Basic",
    provider: { kind: "shodan-dns-resolve" } },
  { slug: "shodan-dns-domain", name: "Shodan Domain Info", category: "IP",
    description: "Subdomains and DNS records for a domain.",
    inputLabel: "Domain", inputPlaceholder: "example.com",
    minTier: "Investigator",
    provider: { kind: "shodan-dns-domain" } },
  { slug: "seon-ip", name: "SEON IP Intelligence", category: "IP",
    description: "Proxy / VPN / Tor / datacenter detection, geo and ISP via SEON.",
    inputLabel: "IPv4", inputPlaceholder: "1.1.1.1",
    minTier: "Investigator",
    provider: { kind: "seon-ip" }, comingSoon: true },

  // Identity
  { slug: "holehe", name: "Holehe (Email Recon)", category: "Identity",
    description: "Find sites where an email is registered.",
    inputLabel: "Email", inputPlaceholder: "target@example.com",
    minTier: "Investigator",
    provider: { kind: "oathnet", endpoint: "/holehe", param: "email" } },
  { slug: "ghunt", name: "GHunt (Google OSINT)", category: "Identity",
    description: "Pivot a Google identity to public artifacts.",
    inputLabel: "Email", inputPlaceholder: "target@gmail.com",
    minTier: "Investigator",
    provider: { kind: "oathnet", endpoint: "/ghunt", param: "email" } },

  // Identity — SEON
  { slug: "seon-email", name: "SEON Email Footprint", category: "Identity",
    description: "Digital footprint, breach hits, and 90+ social/registration checks for an email.",
    inputLabel: "Email", inputPlaceholder: "target@example.com",
    minTier: "Investigator",
    provider: { kind: "seon-email" }, comingSoon: true },
  { slug: "seon-phone", name: "SEON Phone Footprint", category: "Identity",
    description: "Carrier, line type, HLR and social footprint (WhatsApp, Telegram, Viber…) for a phone number.",
    inputLabel: "Phone (E.164)", inputPlaceholder: "+14155551234",
    minTier: "Investigator",
    provider: { kind: "seon-phone" }, comingSoon: true },

  // Identity — OSINT.Industries
  { slug: "osintind-email", name: "OSINT.Industries — Email", category: "Identity",
    description: "Account discovery across 500+ platforms keyed off an email address.",
    inputLabel: "Email", inputPlaceholder: "target@example.com",
    minTier: "Investigator",
    provider: { kind: "osintindustries", type: "email" }, comingSoon: true },
  { slug: "osintind-username", name: "OSINT.Industries — Username", category: "Identity",
    description: "Account discovery across 500+ platforms keyed off a username.",
    inputLabel: "Username", inputPlaceholder: "targetuser",
    minTier: "Investigator",
    provider: { kind: "osintindustries", type: "username" }, comingSoon: true },
  { slug: "osintind-phone", name: "OSINT.Industries — Phone", category: "Identity",
    description: "Account discovery across 500+ platforms keyed off a phone number (E.164).",
    inputLabel: "Phone (E.164)", inputPlaceholder: "+14155551234",
    minTier: "Investigator",
    provider: { kind: "osintindustries", type: "phone" }, comingSoon: true },

  // Location — GEOINT (coming soon)
  { slug: "geo-osint", name: "Geo-OSINT Locator", category: "Location",
    description: "Reverse-geolocate images, EXIF + landmark recognition, IP→city triangulation and street-view pivots.",
    inputLabel: "Image URL / coordinates / address", inputPlaceholder: "https://… or 48.8584,2.2945",
    minTier: "Investigator",
    provider: { kind: "coming-soon" }, comingSoon: true, image: geointImg },

  // Face — biometric search (coming soon)
  { slug: "face-scan", name: "Face Scan", category: "Face",
    description: "Reverse face search across public web sources. Upload a photo, surface matching profiles.",
    inputLabel: "Image URL", inputPlaceholder: "https://example.com/photo.jpg",
    minTier: "Investigator",
    provider: { kind: "coming-soon" }, comingSoon: true, image: facescanImg },
];

export function moduleBySlug(slug: string): ModuleDef | undefined {
  return MODULES.find((m) => m.slug === slug);
}

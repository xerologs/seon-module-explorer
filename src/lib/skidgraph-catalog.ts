export type NodeKind = {
  slug: string;
  label: string;
  group: string;
  color: string;
  logo: string;          // short text fallback / monogram
  brand?: string;        // simpleicons slug (https://cdn.simpleicons.org/<brand>)
  description: string;   // shown in palette hover tooltip
};

const core: NodeKind[] = [
  { slug: "person",   label: "Person",        group: "Personal", color: "#6366f1", logo: "P",   description: "A real human identity — the central subject of an investigation." },
  { slug: "alias",    label: "Alias",         group: "Personal", color: "#8b5cf6", logo: "A",   description: "A pseudonym, handle, screen name, or other identity a person operates under." },
  { slug: "email",    label: "Email",         group: "Personal", color: "#0ea5e9", logo: "@",   description: "An email address tied to accounts, breaches, or communications." },
  { slug: "phone",    label: "Phone",         group: "Personal", color: "#10b981", logo: "☎",   description: "A phone number — useful for SIM-swap, OSINT lookups, and carrier traces." },
  { slug: "username", label: "Username",      group: "Personal", color: "#a855f7", logo: "U",   description: "A reusable handle the subject uses across services. Pivot through Sherlock-style lookups." },
  { slug: "address",  label: "Address",       group: "Personal", color: "#f59e0b", logo: "⌂",   description: "A physical postal address — home, work, or shipping location." },
  { slug: "dob",      label: "Date of Birth", group: "Personal", color: "#f97316", logo: "DOB", description: "Subject's date of birth. Common security-question / verification pivot." },
  { slug: "school",   label: "School",        group: "Personal", color: "#06b6d4", logo: "S",   description: "An education institution the subject attended." },
  { slug: "employer", label: "Employer",      group: "Personal", color: "#84cc16", logo: "E",   description: "A company or organization the subject works for or contracted with." },
  { slug: "vehicle",  label: "Vehicle",       group: "Personal", color: "#eab308", logo: "V",   description: "A vehicle linked to the subject — plate, VIN, or make/model." },
  { slug: "document", label: "Document",      group: "Personal", color: "#94a3b8", logo: "DOC", description: "Any document (ID, invoice, leak file) attached as evidence." },

  { slug: "instagram", label: "Instagram", group: "Social", color: "#e1306c", logo: "IG", brand: "instagram", description: "Instagram account — pivot via username, bio, tagged photos, followers." },
  { slug: "snapchat",  label: "Snapchat",  group: "Social", color: "#fffc00", logo: "SC", brand: "snapchat",  description: "Snapchat handle. Snap Map and Bitmoji can leak location and likeness." },
  { slug: "tiktok",    label: "TikTok",    group: "Social", color: "#00f2ea", logo: "TT", brand: "tiktok",    description: "TikTok account — video metadata, bio links, and follower graph are valuable." },
  { slug: "x",         label: "X / Twitter", group: "Social", color: "#1d9bf0", logo: "𝕏", brand: "x", description: "X (formerly Twitter) account. Public timeline + replies are a rich pivot surface." },
  { slug: "facebook",  label: "Facebook",  group: "Social", color: "#1877f2", logo: "f",  brand: "facebook",  description: "Facebook profile. Friends list, photos, and check-ins are common starting points." },
  { slug: "youtube",   label: "YouTube",   group: "Social", color: "#ff0000", logo: "▶",  brand: "youtube",   description: "YouTube channel — comments, community posts, and channel-about links pivot well." },
  { slug: "reddit",    label: "Reddit",    group: "Social", color: "#ff4500", logo: "r/", brand: "reddit",    description: "Reddit account. Comment history exposes geography, schedule, and interests." },
  { slug: "linkedin",  label: "LinkedIn",  group: "Social", color: "#0a66c2", logo: "in", brand: "linkedin",  description: "LinkedIn profile — employment, education, and professional network." },
  { slug: "github",    label: "GitHub",    group: "Social", color: "#f0f6fc", logo: "GH", brand: "github",    description: "GitHub account. Commit emails, gists, and starred repos leak identity." },

  { slug: "discord",   label: "Discord",   group: "Messaging", color: "#5865f2", logo: "D",  brand: "discord",  description: "Discord account — tag, user ID, mutual servers, and avatars." },
  { slug: "telegram",  label: "Telegram",  group: "Messaging", color: "#229ed9", logo: "✈",  brand: "telegram", description: "Telegram username or phone. Public groups and channel membership are searchable." },
  { slug: "whatsapp",  label: "WhatsApp",  group: "Messaging", color: "#25d366", logo: "WA", brand: "whatsapp", description: "WhatsApp number / profile. About text and profile photo can confirm identity." },
  { slug: "signal",    label: "Signal",    group: "Messaging", color: "#3a76f0", logo: "S",  brand: "signal",   description: "Signal account, identified by phone number or username." },

  { slug: "btc",     label: "Bitcoin",  group: "Crypto", color: "#f7931a", logo: "₿", brand: "bitcoin",  description: "A Bitcoin address — trace flows on-chain via mempool / blockchair." },
  { slug: "eth",     label: "Ethereum", group: "Crypto", color: "#627eea", logo: "Ξ", brand: "ethereum", description: "An Ethereum address. ENS, NFT holdings, and tx history are public." },
  { slug: "wallet",  label: "Wallet",   group: "Crypto", color: "#facc15", logo: "◈", description: "A generic crypto wallet — exchange account, hot wallet, or hardware device." },

  { slug: "ip",       label: "IP Address", group: "Network", color: "#22d3ee", logo: "IP",  description: "An IPv4 or IPv6 address — pivot via GeoIP, ASN, and abuse databases." },
  { slug: "domain",   label: "Domain",     group: "Network", color: "#34d399", logo: "⌘",   description: "A registered domain name. WHOIS, DNS, and SSL records expose owners." },
  { slug: "url",      label: "URL",        group: "Network", color: "#38bdf8", logo: "URL", description: "A specific URL — phishing link, leak post, or piece of evidence." },
  { slug: "asn",      label: "ASN",        group: "Network", color: "#94a3b8", logo: "AS",  description: "An autonomous system — groups IP ranges belonging to one network operator." },
  { slug: "dns",      label: "DNS",        group: "Network", color: "#2dd4bf", logo: "DNS", description: "A DNS record (A, MX, TXT, etc.) attached to a domain." },
  { slug: "breach",   label: "Breach",     group: "Data",    color: "#ef4444", logo: "BR",  description: "A specific data breach the subject's credentials appeared in." },
  { slug: "password", label: "Password",   group: "Data",    color: "#f43f5e", logo: "PW",  description: "A password (or hash) found in a leak, tied to a credential pair." },
  { slug: "paste",    label: "Paste",      group: "Data",    color: "#fb7185", logo: "PST", description: "A pastebin / paste-site dump containing relevant data." },
];

// [Label, Group, Color, Monogram, simpleicons-slug?, description?]
const brandRows: Array<[string, string, string, string, string?, string?]> = [
  ["Threads", "Social", "#000000", "TH", "threads", "Threads (Meta) account, tightly coupled to Instagram."],
  ["Bluesky", "Social", "#1185fe", "BS", "bluesky", "Bluesky handle on the AT Protocol."],
  ["Mastodon", "Social", "#6364ff", "M", "mastodon", "Mastodon account on a federated instance."],
  ["Tumblr", "Social", "#36465d", "T", "tumblr", "Tumblr blog — long-lived alias and reblog graph."],
  ["Pinterest", "Social", "#e60023", "P", "pinterest", "Pinterest profile — boards reveal interests and aesthetic."],
  ["Twitch", "Social", "#9146ff", "Tw", "twitch", "Twitch streaming account — VODs and chat logs."],
  ["Kick", "Social", "#53fc18", "K", "kick", "Kick streaming account."],
  ["Quora", "Social", "#b92b27", "Q", "quora", "Quora profile — question history exposes domain expertise."],
  ["Medium", "Social", "#00ab6c", "Me", "medium", "Medium writer profile."],
  ["VK", "Social", "#0077ff", "VK", "vk", "VKontakte (Russian) profile."],
  ["Weibo", "Social", "#e6162d", "Wb", "sinaweibo", "Sina Weibo microblog."],
  ["Flickr", "Social", "#ff0084", "Fl", "flickr", "Flickr photo account — EXIF often intact."],
  ["Dribbble", "Social", "#ea4c89", "Db", "dribbble", "Dribbble designer portfolio."],
  ["Behance", "Social", "#1769ff", "Be", "behance", "Behance design portfolio."],
  ["DeviantArt", "Social", "#05cc47", "DA", "deviantart", "DeviantArt artist account."],
  ["Patreon", "Social", "#ff424d", "Pa", "patreon", "Patreon creator page."],
  ["OnlyFans", "Social", "#00aff0", "OF", "onlyfans", "OnlyFans creator profile."],
  ["BeReal", "Social", "#111111", "BR", "bereal", "BeReal account — daily location-tagged photo."],
  ["Clubhouse", "Social", "#f2c94c", "CH", undefined, "Clubhouse audio social profile."],
  ["Nextdoor", "Social", "#8ed500", "Nd", "nextdoor", "Nextdoor neighborhood profile — confirms geography."],
  ["Myspace", "Social", "#003399", "My", "myspace", "Legacy Myspace profile — useful for archival aliases."],

  ["Skype", "Messaging", "#00aff0", "Sk", "skype", "Skype username or live: ID."],
  ["WeChat", "Messaging", "#07c160", "WC", "wechat", "WeChat account (China-centric messenger)."],
  ["LINE", "Messaging", "#06c755", "LN", "line", "LINE messenger account."],
  ["Viber", "Messaging", "#7360f2", "Vi", "viber", "Viber messenger account."],
  ["Kik", "Messaging", "#5ac710", "Ki", "kik", "Kik messenger username."],
  ["Guilded", "Messaging", "#f5c400", "G", "guilded", "Guilded community account."],
  ["Matrix", "Messaging", "#000000", "Mx", "matrix", "Matrix MXID across federated homeservers."],
  ["Slack", "Messaging", "#4a154b", "Sl", "slack", "Slack workspace identity."],
  ["Teams", "Messaging", "#6264a7", "Tm", "microsoftteams", "Microsoft Teams account."],
  ["Messenger", "Messaging", "#0084ff", "Ms", "messenger", "Facebook Messenger account."],
  ["iMessage", "Messaging", "#34c759", "iM", "imessage", "iMessage account (Apple ID / phone)."],
  ["Session", "Messaging", "#00f782", "Se", "session", "Session privacy messenger."],
  ["Element", "Messaging", "#0dbd8b", "El", "element", "Element Matrix client account."],
  ["Wire", "Messaging", "#000000", "Wr", "wire", "Wire secure messenger account."],
  ["Threema", "Messaging", "#3fe669", "Th", "threema", "Threema messenger ID."],

  ["Steam", "Gaming", "#66c0f4", "St", "steam", "Steam profile — game library, friends, badges."],
  ["Roblox", "Gaming", "#e2231a", "Rb", "roblox", "Roblox profile — friends list and game history."],
  ["Xbox", "Gaming", "#107c10", "X", "xbox", "Xbox Live gamertag."],
  ["PlayStation", "Gaming", "#006fcd", "PS", "playstation", "PlayStation Network ID."],
  ["Epic Games", "Gaming", "#313131", "EG", "epicgames", "Epic Games / Fortnite account."],
  ["Minecraft", "Gaming", "#62b47a", "MC", "minecraft", "Minecraft Java / Bedrock username."],
  ["Riot Games", "Gaming", "#d32936", "RG", "riotgames", "Riot Games account (LoL / Valorant)."],
  ["Valorant", "Gaming", "#ff4655", "V", "valorant", "Valorant in-game tag (Name#Tag)."],
  ["League of Legends", "Gaming", "#c89b3c", "LoL", "leagueoflegends", "League of Legends summoner."],
  ["Battle.net", "Gaming", "#00aeef", "BN", "battledotnet", "Blizzard Battle.net BattleTag."],
  ["Overwatch", "Gaming", "#f99e1a", "OW", undefined, "Overwatch player tag."],
  ["EA", "Gaming", "#ff4747", "EA", "ea", "EA / Origin account."],
  ["Ubisoft", "Gaming", "#008ef6", "Ub", "ubisoft", "Ubisoft Connect account."],
  ["Nintendo", "Gaming", "#e60012", "N", "nintendo", "Nintendo Network ID / Switch friend code."],
  ["Fortnite", "Gaming", "#7c3aed", "Fn", "epicgames", "Fortnite username (Epic account)."],
  ["FiveM", "Gaming", "#f40552", "5M", undefined, "FiveM GTA RP identity."],
  ["Rockstar", "Gaming", "#fcaf17", "R*", "rockstargames", "Rockstar Social Club account."],
  ["Faceit", "Gaming", "#ff5500", "Fa", "faceit", "FACEIT competitive account."],
  ["ESEA", "Gaming", "#ef4444", "ES", undefined, "ESEA competitive league account."],
  ["Chess.com", "Gaming", "#81b64c", "Cc", "chessdotcom", "Chess.com profile — Elo + game history."],
  ["Lichess", "Gaming", "#8b8b8b", "Li", "lichess", "Lichess profile."],
  ["Pokémon", "Gaming", "#ffcb05", "Pk", "pokemon", "Pokémon trainer profile."],
  ["Twitch Rivals", "Gaming", "#9146ff", "TR", "twitch", "Twitch Rivals competitor account."],
  ["VRChat", "Gaming", "#2563eb", "VR", "vrchat", "VRChat avatar / account."],

  ["PayPal", "Commerce", "#003087", "PP", "paypal", "PayPal account — receipts, friend payments, shipping address."],
  ["Cash App", "Commerce", "#00d632", "$", "cashapp", "Cash App $cashtag."],
  ["Venmo", "Commerce", "#3d95ce", "V", "venmo", "Venmo profile — transactions historically public."],
  ["Stripe", "Commerce", "#635bff", "St", "stripe", "Stripe customer or account."],
  ["Shopify", "Commerce", "#95bf47", "Sh", "shopify", "Shopify storefront or merchant."],
  ["Amazon", "Commerce", "#ff9900", "Az", "amazon", "Amazon profile / wishlist / reviews."],
  ["eBay", "Commerce", "#e53238", "eB", "ebay", "eBay buyer / seller account."],
  ["Etsy", "Commerce", "#f1641e", "Et", "etsy", "Etsy storefront."],
  ["Depop", "Commerce", "#ff2300", "Dp", "depop", "Depop reseller profile."],
  ["Vinted", "Commerce", "#007782", "Vi", "vinted", "Vinted secondhand listings."],
  ["Mercari", "Commerce", "#ff0211", "Mc", "mercari", "Mercari marketplace account."],
  ["OfferUp", "Commerce", "#00a87e", "OU", "offerup", "OfferUp local marketplace profile."],
  ["Grailed", "Commerce", "#111111", "Gr", "grailed", "Grailed menswear marketplace account."],
  ["StockX", "Commerce", "#00c853", "SX", "stockx", "StockX trading account."],
  ["GOAT", "Commerce", "#111111", "Gt", "goat", "GOAT sneaker marketplace."],
  ["Klarna", "Commerce", "#ffb3c7", "Kl", "klarna", "Klarna BNPL account."],
  ["Wise", "Commerce", "#9fe870", "Wi", "wise", "Wise multi-currency account."],
  ["Revolut", "Commerce", "#0075eb", "Re", "revolut", "Revolut neobank account."],
  ["Monzo", "Commerce", "#ff4d56", "Mo", "monzo", "Monzo neobank account."],
  ["Chime", "Commerce", "#00c389", "Ch", "chime", "Chime banking account."],
  ["Zelle", "Commerce", "#6d1ed4", "Z", "zelle", "Zelle bank-transfer identifier (phone/email)."],

  ["Solana", "Crypto", "#14f195", "SOL", "solana", "Solana address — fast on-chain pivots."],
  ["Litecoin", "Crypto", "#345d9d", "Ł", "litecoin", "Litecoin address."],
  ["Monero", "Crypto", "#ff6600", "XMR", "monero", "Monero address — privacy coin, low traceability."],
  ["Tether", "Crypto", "#26a17b", "USDT", "tether", "Tether (USDT) flow — multi-chain stablecoin."],
  ["USDC", "Crypto", "#2775ca", "USDC", undefined, "USDC stablecoin transfer."],
  ["BNB", "Crypto", "#f3ba2f", "BNB", "binance", "BNB chain wallet."],
  ["Binance", "Crypto", "#f0b90b", "Bi", "binance", "Binance exchange account."],
  ["Coinbase", "Crypto", "#0052ff", "Cb", "coinbase", "Coinbase exchange account."],
  ["Kraken", "Crypto", "#5741d9", "Kr", "kraken", "Kraken exchange account."],
  ["MetaMask", "Crypto", "#f6851b", "MM", "metamask", "MetaMask wallet — browser extension hot wallet."],
  ["Phantom", "Crypto", "#ab9ff2", "Ph", undefined, "Phantom Solana wallet."],
  ["Ledger", "Crypto", "#111111", "Lg", "ledger", "Ledger hardware wallet."],
  ["Trezor", "Crypto", "#0f6148", "Tz", "trezor", "Trezor hardware wallet."],
  ["OpenSea", "Crypto", "#2081e2", "OS", "opensea", "OpenSea NFT marketplace profile."],
  ["Etherscan", "Crypto", "#21325b", "Es", "ethereum", "Etherscan transaction view of an ETH address."],
  ["Polygonscan", "Crypto", "#8247e5", "Ps", "polygon", "Polygonscan record of a Polygon address."],
  ["TRON", "Crypto", "#eb0029", "TRX", "tron", "Tron (TRX) address."],
  ["Dogecoin", "Crypto", "#c2a633", "Ð", "dogecoin", "Dogecoin address."],
  ["Cardano", "Crypto", "#0033ad", "ADA", "cardano", "Cardano (ADA) address."],
  ["XRP", "Crypto", "#23292f", "XRP", "xrp", "Ripple (XRP) address."],
  ["Avalanche", "Crypto", "#e84142", "AVAX", undefined, "Avalanche (AVAX) address."],

  ["Cloudflare", "Network", "#f38020", "CF", "cloudflare", "Cloudflare-fronted service — origin often hidden."],
  ["AWS", "Network", "#ff9900", "AWS", "amazonwebservices", "AWS account / S3 bucket / EC2 host."],
  ["Azure", "Network", "#0078d4", "Az", "microsoftazure", "Microsoft Azure resource."],
  ["Google Cloud", "Network", "#4285f4", "GCP", "googlecloud", "Google Cloud Platform resource."],
  ["DigitalOcean", "Network", "#0080ff", "DO", "digitalocean", "DigitalOcean droplet."],
  ["Linode", "Network", "#00a95c", "Ln", "linode", "Linode (Akamai) host."],
  ["Hetzner", "Network", "#d50c2d", "Hz", "hetzner", "Hetzner server / cloud."],
  ["OVHcloud", "Network", "#123f6d", "OVH", "ovh", "OVHcloud / OVH dedicated server."],
  ["Vultr", "Network", "#007bfc", "Vu", "vultr", "Vultr cloud host."],
  ["Namecheap", "Network", "#de3723", "NC", "namecheap", "Namecheap registrar account."],
  ["GoDaddy", "Network", "#00a4a6", "GD", "godaddy", "GoDaddy registrar account."],
  ["Google Domains", "Network", "#4285f4", "GD", "google", "Google Domains registration."],
  ["Tucows", "Network", "#f47b20", "Tc", undefined, "Tucows / OpenSRS registrar."],
  ["WHOIS", "Network", "#22d3ee", "Who", undefined, "WHOIS record snapshot for a domain."],
  ["Shodan", "Network", "#d71920", "Sh", "shodan", "Shodan host fingerprint."],
  ["Censys", "Network", "#5b6ee1", "Cy", "censys", "Censys scan result."],
  ["VirusTotal", "Network", "#394eff", "VT", "virustotal", "VirusTotal report on file / URL / host."],
  ["AbuseIPDB", "Network", "#f97316", "AI", "abuseipdb", "AbuseIPDB reputation entry."],
  ["GreyNoise", "Network", "#13b5ea", "GN", undefined, "GreyNoise background-noise classification."],
  ["BuiltWith", "Network", "#2a7fff", "BW", "builtwith", "BuiltWith tech-stack fingerprint."],
  ["Wappalyzer", "Network", "#4608ad", "Wz", "wappalyzer", "Wappalyzer tech detection."],

  ["Google", "Accounts", "#4285f4", "G", "google", "Google account — Gmail, YouTube, Drive, Maps reviews."],
  ["Apple", "Accounts", "#a2aaad", "", "apple", "Apple ID — iCloud, iMessage, Find My."],
  ["Microsoft", "Accounts", "#00a4ef", "MS", "microsoft", "Microsoft account — Outlook, Xbox, OneDrive."],
  ["Yahoo", "Accounts", "#6001d2", "Y!", "yahoo", "Yahoo account / mailbox."],
  ["Proton", "Accounts", "#6d4aff", "Pr", "protonmail", "Proton Mail / Drive / VPN account."],
  ["Gmail", "Accounts", "#ea4335", "Gm", "gmail", "Gmail address (Google account)."],
  ["Outlook", "Accounts", "#0078d4", "Ol", undefined, "Outlook.com mailbox."],
  ["iCloud", "Accounts", "#60a5fa", "iC", "icloud", "iCloud mailbox / Apple ID."],
  ["AOL", "Accounts", "#000000", "AOL", undefined, "AOL mailbox."],
  ["Yandex", "Accounts", "#fc3f1d", "Ya", "yandex", "Yandex account / mailbox."],
  ["Mail.ru", "Accounts", "#168de2", "MR", "maildotru", "Mail.ru account."],
  ["Fastmail", "Accounts", "#5c2d91", "FM", "fastmail", "Fastmail mailbox."],
  ["Zoho", "Accounts", "#e42527", "Zo", "zoho", "Zoho account / mailbox."],
  ["Dropbox", "Accounts", "#0061ff", "Db", "dropbox", "Dropbox account — shared links can leak."],
  ["Notion", "Accounts", "#111111", "No", "notion", "Notion workspace / public page."],
  ["Obsidian", "Accounts", "#7c3aed", "Ob", "obsidian", "Obsidian sync account."],
  ["Evernote", "Accounts", "#00a82d", "Ev", "evernote", "Evernote account."],
  ["Trello", "Accounts", "#0079bf", "Tr", "trello", "Trello board / account."],
  ["Asana", "Accounts", "#fc636b", "As", "asana", "Asana workspace account."],
  ["Figma", "Accounts", "#f24e1e", "Fg", "figma", "Figma account / public file."],
  ["Canva", "Accounts", "#00c4cc", "Cv", "canva", "Canva design account."],

  ["Have I Been Pwned", "Data", "#2a6379", "HIBP", undefined, "HIBP entry — confirms exposure in known breaches."],
  ["DeHashed", "Data", "#ef4444", "DH", undefined, "DeHashed credential record."],
  ["LeakCheck", "Data", "#dc2626", "LC", undefined, "LeakCheck credential record."],
  ["Snusbase", "Data", "#f97316", "SB", undefined, "Snusbase breach record."],
  ["IntelX", "Data", "#334155", "IX", undefined, "Intelligence X dark/clear-web record."],
  ["BreachForums", "Data", "#991b1b", "BF", undefined, "BreachForums leak post or seller."],
  ["Pastebin", "Data", "#22c55e", "Pb", "pastebin", "Pastebin paste containing relevant data."],
  ["Ghostbin", "Data", "#94a3b8", "Gb", undefined, "Ghostbin paste."],
  ["GitLab", "Data", "#fc6d26", "GL", "gitlab", "GitLab account / repo."],
  ["Bitbucket", "Data", "#0052cc", "BB", "bitbucket", "Bitbucket account / repo."],
  ["Docker Hub", "Data", "#2496ed", "DH", "docker", "Docker Hub user / image."],
  ["Hugging Face", "Data", "#ffcc4d", "HF", "huggingface", "Hugging Face account / model."],
  ["Kaggle", "Data", "#20beff", "Kg", "kaggle", "Kaggle profile / notebook."],
  ["Wayback", "Data", "#f59e0b", "WB", "internetarchive", "Wayback Machine snapshot."],
  ["Archive.today", "Data", "#e11d48", "AT", undefined, "Archive.today snapshot."],
  ["Pipl", "Data", "#2563eb", "Pi", undefined, "Pipl people-search record."],
  ["Spokeo", "Data", "#65a30d", "Sp", undefined, "Spokeo people-search record."],
  ["Truecaller", "Data", "#1d4ed8", "TC", undefined, "Truecaller phone reverse-lookup."],
  ["NumLookup", "Data", "#06b6d4", "NL", undefined, "NumLookup phone reverse-lookup."],
  ["Hunter", "Data", "#ff6c37", "Hu", undefined, "Hunter.io email pattern result."],
  ["Clearbit", "Data", "#2563eb", "Cb", undefined, "Clearbit enrichment record."],
];

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const seen = new Set(core.map((item) => item.slug));
const brandCatalog = brandRows.flatMap(([label, group, color, logo, brand, description]) => {
  const slug = slugify(label);
  if (seen.has(slug)) return [];
  seen.add(slug);
  return [{ slug, label, group, color, logo, brand, description: description ?? `${label} — ${group.toLowerCase()} identity surface.` } satisfies NodeKind];
});

export const CATALOG: NodeKind[] = [...core, ...brandCatalog];
export const CATALOG_BY_SLUG: Record<string, NodeKind> = Object.fromEntries(CATALOG.map((c) => [c.slug, c]));

export const FALLBACK_KIND: NodeKind = {
  slug: "custom",
  label: "Custom",
  group: "Custom",
  color: "#f43f5e",
  logo: "★",
  description: "A custom node you defined — use this for anything the standard catalog doesn't cover.",
};

/**
 * Resolve a renderable logo URL for a kind. Uses simpleicons CDN when a brand
 * slug is provided. Returns null for nodes that should render their text logo.
 */
export function logoUrl(kind: NodeKind): string | null {
  if (!kind.brand) return null;
  // Simple Icons CDN renders an SVG tinted to the requested hex.
  const hex = kind.color.replace("#", "");
  return `https://cdn.simpleicons.org/${kind.brand}/${hex}`;
}

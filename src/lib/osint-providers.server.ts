/**
 * Per-provider HTTP dispatch for OSINT modules.
 *
 * SERVER-ONLY. Reads provider API keys from process.env inside `runModule`,
 * never at module scope.
 */
import type { ModuleDef, ProviderConfig } from "./modules-catalog";

export interface ProviderResult {
  ok: boolean;
  error: string | null;
  /** JSON-encoded payload (string). Stored verbatim as the module result. */
  dataJson: string;
}

function jsonOrRaw(text: string): string {
  try {
    JSON.parse(text);
    return text;
  } catch {
    return JSON.stringify({ raw: text });
  }
}

function missingKey(name: string): ProviderResult {
  return {
    ok: false,
    error: `${name} not configured on server`,
    dataJson: JSON.stringify({ error: `${name} missing` }),
  };
}

async function callJSON(
  url: string,
  init: RequestInit,
): Promise<ProviderResult> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return {
      ok: res.ok,
      error: res.ok ? null : `Upstream ${res.status}`,
      dataJson: jsonOrRaw(text),
    };
  } catch (e) {
    return {
      ok: false,
      error: (e as Error).message,
      dataJson: JSON.stringify({ error: (e as Error).message }),
    };
  }
}

export async function runModule(
  mod: ModuleDef,
  query: string,
): Promise<ProviderResult> {
  const p: ProviderConfig = mod.provider;
  switch (p.kind) {
    case "oathnet": {
      const key = process.env.OATHNET_API_KEY;
      if (!key) return missingKey("OATHNET_API_KEY");
      const url = new URL(`https://oathnet.org/api/service${p.endpoint}`);
      url.searchParams.set(p.param, query);
      return callJSON(url.toString(), {
        method: "GET",
        headers: { "x-api-key": key, accept: "application/json" },
      });
    }

    case "shodan-host": {
      const key = process.env.SHODAN_API_KEY;
      if (!key) return missingKey("SHODAN_API_KEY");
      const ip = encodeURIComponent(query.trim());
      return callJSON(
        `https://api.shodan.io/shodan/host/${ip}?key=${encodeURIComponent(key)}`,
        { method: "GET", headers: { accept: "application/json" } },
      );
    }
    case "shodan-search": {
      const key = process.env.SHODAN_API_KEY;
      if (!key) return missingKey("SHODAN_API_KEY");
      const u = new URL("https://api.shodan.io/shodan/host/search");
      u.searchParams.set("key", key);
      u.searchParams.set("query", query);
      return callJSON(u.toString(), { method: "GET" });
    }
    case "shodan-dns-resolve": {
      const key = process.env.SHODAN_API_KEY;
      if (!key) return missingKey("SHODAN_API_KEY");
      const u = new URL("https://api.shodan.io/dns/resolve");
      u.searchParams.set("hostnames", query);
      u.searchParams.set("key", key);
      return callJSON(u.toString(), { method: "GET" });
    }
    case "shodan-dns-domain": {
      const key = process.env.SHODAN_API_KEY;
      if (!key) return missingKey("SHODAN_API_KEY");
      const domain = encodeURIComponent(query.trim());
      return callJSON(
        `https://api.shodan.io/dns/domain/${domain}?key=${encodeURIComponent(key)}`,
        { method: "GET" },
      );
    }

    case "leakcheck-public": {
      const u = new URL("https://leakcheck.io/api/public");
      u.searchParams.set("check", query);
      return callJSON(u.toString(), {
        method: "GET",
        headers: { accept: "application/json" },
      });
    }
    case "leakcheck-pro": {
      const key = process.env.LEAKCHECK_API_KEY;
      if (!key) return missingKey("LEAKCHECK_API_KEY");
      const value = encodeURIComponent(query.trim());
      const u = `https://leakcheck.io/api/v2/query/${value}?type=${p.type}`;
      return callJSON(u, {
        method: "GET",
        headers: { "X-API-Key": key, accept: "application/json" },
      });
    }

    case "seon-email": {
      const key = process.env.SEON_API_KEY;
      if (!key) return missingKey("SEON_API_KEY");
      const u = new URL("https://api.seon.io/SeonRestService/email-api/v3");
      u.searchParams.set("email", query);
      return callJSON(u.toString(), {
        method: "GET",
        headers: { "X-API-KEY": key, accept: "application/json" },
      });
    }
    case "seon-phone": {
      const key = process.env.SEON_API_KEY;
      if (!key) return missingKey("SEON_API_KEY");
      const u = new URL("https://api.seon.io/SeonRestService/phone-api/v2");
      u.searchParams.set("number", query);
      return callJSON(u.toString(), {
        method: "GET",
        headers: { "X-API-KEY": key, accept: "application/json" },
      });
    }
    case "seon-ip": {
      const key = process.env.SEON_API_KEY;
      if (!key) return missingKey("SEON_API_KEY");
      const u = new URL("https://api.seon.io/SeonRestService/ip-api/v1");
      u.searchParams.set("ip", query);
      return callJSON(u.toString(), {
        method: "GET",
        headers: { "X-API-KEY": key, accept: "application/json" },
      });
    }

    case "tgscan": {
      const key = process.env.TGSCAN_API_KEY;
      if (!key) return missingKey("TGSCAN_API_KEY");
      const form = new URLSearchParams({ query: query.replace(/^@/, "") });
      return callJSON("https://api.tgdev.io/tgscan/v1/search", {
        method: "POST",
        headers: {
          "Api-Key": key,
          "Content-Type": "application/x-www-form-urlencoded",
          accept: "application/json",
        },
        body: form.toString(),
      });
    }

    case "osintindustries": {
      const key = process.env.OSINT_INDUSTRIES_API_KEY;
      if (!key) return missingKey("OSINT_INDUSTRIES_API_KEY");
      return callJSON("https://api.osint.industries/v2/request", {
        method: "POST",
        headers: {
          "api-key": key,
          "Content-Type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({ type: p.type, query, timeout: 60 }),
      });
    }

    case "coming-soon":
      return {
        ok: false,
        error: "Module not yet available",
        dataJson: JSON.stringify({ status: "coming_soon" }),
      };
  }
}
## What I already verified
- **Working keys (3):** Shodan, Seon, Endato
- **Dead/expired keys (5):** IntelX, LeakCheck, OSINT Industries (out of credits), LeakOSINT primary, LeakOSINT secondary
- **Blocked by IP allowlist (1):** HackCheck — key may still work from your own IP; need to test from a whitelisted machine
- **Unknown — guessed wrong (~20):** see list below

## What I need from you to finish the rest
For each provider in the unknown bucket, paste:
1. The real base URL (e.g. `https://api.example.com/v2`)
2. The auth header (e.g. `Authorization: Bearer <key>` vs `X-Api-Key: <key>` vs query param `?key=`)
3. One sample endpoint path (e.g. `/lookup/email`) and method (GET/POST)

Easiest format: drop a curl example for any one endpoint per provider and I'll mirror it.

## Providers needing endpoint info
TGScan, Keyscore, IntelGain, OsintCat, Myth, OSINT_API (generic), IntelVault, Traceback, Oath, IntelFetch, Rutify, Advanced GHunt, CallerAPI, Carfax (private host on 176.100.39.202 — need correct path), LeakSight, Fetchbase, Breachbase, Nosint (returns 405 — wrong method, probably needs GET or different path), OsintKit, Geovision, OsintDog, Rust

## After you provide that
- Re-run the probe script with corrected endpoints per provider
- Produce a final pass/fail table
- Optional: bake the verified provider list into the skid app so dead modules are auto-disabled

No project files will be modified during the re-test — it stays a one-off sandbox script until you ask me to integrate.

import levenshtein from "fast-levenshtein";
import { fuzzyDomainsDb, allowedDomainsDb, blockedDomainsDb } from "./db";

const DEFAULT_LEVENSHTEIN_TOLERANCE = 3;

interface CheckDomainResult {
  result: boolean;
  type: "allowed" | "blocked" | "fuzzy" | "unknown";
  extra?: string;
}

let domainCheckCache = new Map<string, CheckDomainResult>();
let lastCacheClear = Date.now();

export function clearDomainCheckCache() {
  const now = Date.now();
  if (now - lastCacheClear > 1000 * 60 * 60) { // clear cache every hour
    domainCheckCache = new Map();
    lastCacheClear = now;
  }
}

export async function checkDomain(domain: string): Promise<CheckDomainResult> {
  clearDomainCheckCache();
  if (!domainCheckCache.has(domain)) {
    domainCheckCache.set(domain, _checkDomain(domain));
  }

  return domainCheckCache.get(domain);
}

function _checkDomain(domain: string): CheckDomainResult {
  const topLevelDomain = domain.split(".").slice(-2).join(".");
  const isAllowed = allowedDomainsDb.data.has(domain) || allowedDomainsDb.data.has(topLevelDomain);
  if (isAllowed)
    return { result: false, type: "allowed" };


  const isBlocked = blockedDomainsDb.data.has(domain) || blockedDomainsDb.data.has(topLevelDomain);
  if (isBlocked)
    return { result: true, type: "blocked" };


  let fuzzyResult: CheckDomainResult

  for (const fuzzyDomain of fuzzyDomainsDb.data) {
    if (fuzzyResult) break;
    const distance = levenshtein.get(fuzzyDomain, domain)
    let distanceTop = distance
    if (topLevelDomain !== domain)
      distanceTop = levenshtein.get(fuzzyDomain, topLevelDomain)
    const isMatched = distance <= DEFAULT_LEVENSHTEIN_TOLERANCE || distanceTop <= DEFAULT_LEVENSHTEIN_TOLERANCE
    if (isMatched) {
      console.log("fuzzy match", { domain, fuzzyDomain, distance })
      fuzzyResult = { result: true, type: "fuzzy", extra: fuzzyDomain }
    }
  }

  return fuzzyResult ?? { result: false, type: "unknown" };
}

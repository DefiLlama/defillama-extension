import levenshtein from "fast-levenshtein";
import * as psl from "psl";
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
  if (now - lastCacheClear > 1000 * 60 * 60) {
    domainCheckCache = new Map();
    lastCacheClear = now;
  }
}

const defaultCheckResponse = { result: false, type: "unknown" } as CheckDomainResult;

export async function checkDomain(domain: string): Promise<CheckDomainResult> {
  if (!domain) return defaultCheckResponse;

  clearDomainCheckCache();
  if (!domainCheckCache.has(domain)) {
    domainCheckCache.set(domain, _checkDomain(domain));
  }
  return domainCheckCache.get(domain) || defaultCheckResponse;
}


function _checkDomain(domain: string): CheckDomainResult {
  const parsed = psl.parse(domain);
  if (!parsed || !('domain' in parsed) || !parsed.domain) {
    const fallbackDomain = domain.split(".").slice(-2).join(".");
    return checkDomainInLists(domain, fallbackDomain);
  }
  const rootDomain = parsed.domain;
  return checkDomainInLists(domain, rootDomain);
}

function checkDomainInLists(fullDomain: string, rootDomain: string): CheckDomainResult {
  const isAllowed = allowedDomainsDb.data.has(fullDomain) || allowedDomainsDb.data.has(rootDomain);
  if (isAllowed) return { result: false, type: "allowed" };

  const isBlocked = blockedDomainsDb.data.has(fullDomain) || blockedDomainsDb.data.has(rootDomain);
  if (isBlocked) return { result: true, type: "blocked" };

  let fuzzyResult: CheckDomainResult;
  for (const fuzzyDomain of fuzzyDomainsDb.data) {
    if (fuzzyResult) break;
    const fullDistance = levenshtein.get(fuzzyDomain, fullDomain);
    const rootDistance = levenshtein.get(fuzzyDomain, rootDomain);
    const minDistance = Math.min(fullDistance, rootDistance);
    if (minDistance <= DEFAULT_LEVENSHTEIN_TOLERANCE) {
      fuzzyResult = { result: false, type: "unknown", extra: fuzzyDomain };
    }
  }
  return fuzzyResult ?? defaultCheckResponse;
}

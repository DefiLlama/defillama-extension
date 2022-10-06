import levenshtein from "fast-levenshtein";
import { fuzzyDomainsDb, allowedDomainsDb, blockedDomainsDb } from "./db";

const DEFAULT_LEVENSHTEIN_TOLERANCE = 3;

interface CheckDomainResult {
  result: boolean;
  type: "allowed" | "blocked" | "fuzzy" | "unknown";
  extra?: string;
}

export async function checkDomain(domain: string): Promise<CheckDomainResult> {
  console.log("Checking domain", domain);
  const topLevelDomain = domain.split(".").slice(-2).join(".");
  const isAllowed =
    (await allowedDomainsDb.domains.get({ domain })) ||
    (await allowedDomainsDb.domains.get({ domain: topLevelDomain }));
  if (isAllowed) {
    return { result: false, type: "allowed" };
  }

  const isBlocked =
    (await blockedDomainsDb.domains.get({ domain })) ||
    (await blockedDomainsDb.domains.get({ domain: topLevelDomain }));
  if (isBlocked) {
    return { result: true, type: "blocked" };
  }

  const fuzzyDomains = fuzzyDomainsDb.domains.toCollection();
  let fuzzyResult: CheckDomainResult;
  await fuzzyDomains
    .until((x) => {
      const distance = levenshtein.get(x.domain, domain);
      const distanceTop = levenshtein.get(x.domain, topLevelDomain);
      const isMatched = distance <= DEFAULT_LEVENSHTEIN_TOLERANCE || distanceTop <= DEFAULT_LEVENSHTEIN_TOLERANCE;

      if (isMatched) {
        console.log("fuzzy match", { domain, fuzzyDomain: x.domain, distance });
        fuzzyResult = { result: true, type: "fuzzy", extra: x.domain };
        return true;
      }
    }, true)
    .last();

  if (fuzzyResult) {
    return fuzzyResult;
  }

  return { result: false, type: "unknown" };
}

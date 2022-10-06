import levenshtein from "fast-levenshtein";
import { fuzzyDomainsDb, allowedDomainsDb, blockedDomainsDb } from "./db";

const DEFAULT_LEVENSHTEIN_TOLERANCE = 3;

interface CheckDomainResult {
  result: boolean;
  type: "allowed" | "blocked" | "fuzzy" | "unknown";
  extra?: string;
}

export async function checkDomain(domain: string): Promise<CheckDomainResult> {
  const isAllowed = await allowedDomainsDb.domains.get({ domain });
  if (isAllowed) {
    return { result: false, type: "allowed" };
  }

  const isBlocked = await blockedDomainsDb.domains.get({ domain });
  if (isBlocked) {
    return { result: true, type: "blocked" };
  }

  const fuzzyDomains = fuzzyDomainsDb.domains.toCollection();
  const match = await fuzzyDomains.first((x) => {
    const distance = levenshtein.get(x.domain, domain);
    const isMatched = distance <= DEFAULT_LEVENSHTEIN_TOLERANCE;

    if (isMatched) {
      console.log("fuzzy match", { domain, fuzzyDomain: x.domain, distance });
      return { result: true, type: "fuzzy", extra: x.domain } as const;
    }
  });

  if (match) {
    return match;
  }

  return { result: false, type: "unknown" };
}

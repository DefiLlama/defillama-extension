import levenshtein from "fast-levenshtein";
import { fuzzyDomainsDb, allowedDomainsDb, blockedDomainsDb } from "./db";

const DEFAULT_LEVENSHTEIN_TOLERANCE = 3;

interface CheckDomainResult {
  result: boolean;
  type: "allowed" | "blocked" | "fuzzy" | "unknown";
  extra?: string;
}

// check the domain against the various allow/block/fuzzy lists
// use the temporary storage arrays if they are available
export async function checkDomain(
  domain: string,
  allowedDomainsTmpStorage: { domain: string }[] | null,
  blockedDomainsTmpStorage: { domain: string }[] | null,
  fuzzyDomainsTmpStorage: { domain: string }[] | null,
): Promise<CheckDomainResult> {
  console.log("Checking domain", domain);
  const topLevelDomain = domain.split(".").slice(-2).join(".");
  let isAllowed = false;
  if (allowedDomainsTmpStorage) {
    isAllowed = allowedDomainsTmpStorage.some(({ domain: dmn }) => dmn === domain || dmn === topLevelDomain);
  } else {
    isAllowed =
      !!(await allowedDomainsDb.domains.get({ domain })) ||
      !!(await allowedDomainsDb.domains.get({ domain: topLevelDomain }));
  }
  if (isAllowed) {
    return { result: false, type: "allowed" };
  }
  let isBlocked = false;
  if (blockedDomainsTmpStorage) {
    isBlocked = blockedDomainsTmpStorage.some(({ domain: dmn }) => dmn === domain || dmn === topLevelDomain);
  } else {
    isBlocked =
      !!(await blockedDomainsDb.domains.get({ domain })) ||
      !!(await blockedDomainsDb.domains.get({ domain: topLevelDomain }));
  }
  if (isBlocked) {
    return { result: true, type: "blocked" };
  }

  let fuzzyResult: CheckDomainResult;
  if (fuzzyDomainsTmpStorage) {
    fuzzyDomainsTmpStorage.some((x) => {
      const distance = levenshtein.get(x.domain, domain);
      const distanceTop = levenshtein.get(x.domain, topLevelDomain);
      const isMatched = distance <= DEFAULT_LEVENSHTEIN_TOLERANCE || distanceTop <= DEFAULT_LEVENSHTEIN_TOLERANCE;

      if (isMatched) {
        fuzzyResult = { result: true, type: "fuzzy", extra: x.domain };
        return true;
      }
    });
  } else {
    const fuzzyDomains = fuzzyDomainsDb.domains.toCollection();
    await fuzzyDomains
      .until((x) => {
        const distance = levenshtein.get(x.domain, domain);
        const distanceTop = levenshtein.get(x.domain, topLevelDomain);
        const isMatched = distance <= DEFAULT_LEVENSHTEIN_TOLERANCE || distanceTop <= DEFAULT_LEVENSHTEIN_TOLERANCE;

        if (isMatched) {
          fuzzyResult = { result: true, type: "fuzzy", extra: x.domain };
          return true;
        }
      }, true)
      .last();
  }
  if (fuzzyResult) {
    return fuzzyResult;
  }

  return { result: false, type: "unknown" };
}

import { fetchData } from "./storage";
import { version } from "../../../package.json";
import Browser from "webextension-polyfill";
import cute from "@assets/img/memes/cute-128.png";

import { PROTOCOLS_API, METAMASK_LIST_CONFIG_API, DEFILLAMA_DIRECTORY_API, tokenIconUrl } from "./constants";

export interface Protocol {
  url: string;
  tvl?: number;
  name: string;
  logo: string;
}

export async function checkAndLoadDataIfNeeded() {
  await fetchData({
    key: cacheKey,
    updateFrequency: 60 * 30, // update every 30 minutes
    getData,
  });
  const storageKey = "llama.fi-" + cacheKey;
  const existingData = await Browser.storage.local.get([storageKey]);
  if (!existingData[storageKey]) {
    await updateDb();
    return true;
  }
  // Even if data exists, we need to populate our in-memory DBs
  const storedData = JSON.parse(existingData[storageKey]);
  if (storedData.data) {
    const { allowedDomains = [], blockedDomains = [], fuzzyDomains = [], protocols = [] } = storedData.data;
    allowedDomainsDb.data = new Set([...allowedDomains, ...LOCAL_ALLOWED_DOMAINS]);
    blockedDomainsDb.data = new Set([...blockedDomains, ...LOCAL_BLOCKED_DOMAINS]);
    fuzzyDomainsDb.data = fuzzyDomains;
    protocolDirectoryDb.data = protocols;
  }
  return false;
}

// Local hardcoded lists for custom blocking/allowing
const LOCAL_BLOCKED_DOMAINS = ["llamaswap.org", "lamaswap.org"];

const LOCAL_ALLOWED_DOMAINS = [];

export const blockedDomainsDb: {
  data: Set<string>;
} = {
  data: new Set(LOCAL_BLOCKED_DOMAINS),
};

export const fuzzyDomainsDb: {
  data: string[];
} = {
  data: [],
};

export const allowedDomainsDb: {
  data: Set<string>;
} = {
  data: new Set(LOCAL_ALLOWED_DOMAINS),
};

export const protocolDirectoryDb: {
  data: Array<Protocol>;
} = {
  data: [],
};

const cacheKey = "cache-v" + version;

async function getData() {
  const rawProtocols = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocols = (
    (rawProtocols["protocols"]?.map((x: any) => ({
      url: x.url,
      tvl: x.tvl || 0,
      name: x.name,
      logo: tokenIconUrl(x.name),
    })) ?? []) as Protocol[]
  ).filter((x) => x.name && x.url);

  const protocolDomains = protocols
    .map((x) => {
      try {
        if (!x.url) return null;
        return new URL(x.url).hostname.replace("www.", "");
      } catch (error) {
        return null;
      }
    })
    .filter((x) => x !== null);
  const metamaskLists = (await fetch(METAMASK_LIST_CONFIG_API).then((res) => res.json())) as {
    fuzzylist: string[];
    whitelist: string[];
    blacklist: string[];
  };
  const metamaskFuzzyDomains = metamaskLists.fuzzylist;
  const metamaskAllowedDomains = metamaskLists.whitelist;
  const metamaskBlockedDomains = metamaskLists.blacklist;
  const rawDefillamaDirectory = (await fetch(DEFILLAMA_DIRECTORY_API).then((res) => res.json())) as {
    version: number;
    whitelist: string[];
    blacklist?: string[];
    fuzzylist?: string[];
  };
  const defillamaDomains = rawDefillamaDirectory.whitelist;
  const defillamaBlockedDomains = rawDefillamaDirectory.blacklist ?? [];
  const defillamaFuzzyDomains = rawDefillamaDirectory.fuzzylist ?? [];
  const allowedDomains = getUniqueItems(metamaskAllowedDomains, protocolDomains, defillamaDomains, ["x.com"]);
  const blockedDomains = getUniqueItems(metamaskBlockedDomains, defillamaBlockedDomains);
  const fuzzyDomains = getUniqueItems(metamaskFuzzyDomains, protocolDomains, defillamaDomains, defillamaFuzzyDomains);
  return {
    allowedDomains,
    blockedDomains,
    fuzzyDomains,
    protocols,
  };
}

function getUniqueItems(...arrays) {
  const allItems = arrays.flat();
  return [...new Set(allItems)];
}

export async function updateDb() {
  const res = await fetchData({
    key: cacheKey,
    updateFrequency: 60 * 60, // update every 60 minutes
    getData,
  });
  const { allowedDomains = [], blockedDomains = [], fuzzyDomains = [], protocols = [] } = res;
  allowedDomainsDb.data = new Set([...allowedDomains, ...LOCAL_ALLOWED_DOMAINS]);
  blockedDomainsDb.data = new Set([...blockedDomains, ...LOCAL_BLOCKED_DOMAINS]);
  fuzzyDomainsDb.data = fuzzyDomains;
  protocolDirectoryDb.data = protocols;
  return { allowedDomainsDb, blockedDomainsDb, fuzzyDomainsDb, protocolDirectoryDb };
}

// Regular update every 60 minutes for main data
Browser.alarms.create("updateDomainDbs", { periodInMinutes: 60 });

Browser.alarms.onAlarm.addListener(async (a) => {
  switch (a.name) {
    case "updateDomainDbs":
      await updateDb();
      break;
  }
});

async function startupTasks() {
  await updateDb();
  Browser.action.setIcon({ path: cute });
}

Browser.runtime.onInstalled.addListener(startupTasks);
Browser.runtime.onStartup.addListener(startupTasks);

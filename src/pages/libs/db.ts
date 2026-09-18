import { fetchData } from './storage'
import { version } from '../../../package.json'
import Browser from "webextension-polyfill";
import * as psl from "psl";
import cute from "@assets/img/memes/cute-128.png";

import {
  PROTOCOLS_API,
  METAMASK_LIST_CONFIG_API,
  DEFILLAMA_DIRECTORY_API,
  EXPLORER_CHAIN_PREFIX_MAP,
} from "./constants";

export async function checkAndLoadDataIfNeeded() {
  await fetchData({
    key: cacheKey,
    updateFrequency: 60 * 30, // update every 30 minutes
    getData,
  })
  const storageKey = 'llama.fi-' + cacheKey;
  const existingData = await Browser.storage.local.get([storageKey]);
  if (!existingData[storageKey]) {
    await updateDb();
    return true;
  }
  // Even if data exists, we need to populate our in-memory DBs
  const storedData = JSON.parse(existingData[storageKey]);
  if (storedData.data) {
    const { allowedDomains = [], blockedDomains = [], fuzzyDomains = [] } = storedData.data;
    allowedDomainsDb.data = new Set([...allowedDomains, ...LOCAL_ALLOWED_DOMAINS]);
    blockedDomainsDb.data = new Set([...blockedDomains, ...LOCAL_BLOCKED_DOMAINS]);
    fuzzyDomainsDb.data = fuzzyDomains;
    dbVersion.n++;
  }
  return false;
}

// Local hardcoded lists for custom blocking/allowing
const LOCAL_BLOCKED_DOMAINS = [
  'llamaswap.org',
  'lamaswap.org',
];

const LOCAL_ALLOWED_DOMAINS: string[] = [];

export const blockedDomainsDb: {
  data: Set<string>
} = {
  data: new Set(LOCAL_BLOCKED_DOMAINS)
}

export const fuzzyDomainsDb: {
  data: string[]
} = {
  data: []
}

export const allowedDomainsDb: {
  data: Set<string>
} = {
  data: new Set(LOCAL_ALLOWED_DOMAINS)
}

const cacheKey = 'cache-v' + version

// bumped whenever the in-memory lists change so cached domain verdicts can be invalidated
export const dbVersion = { n: 0 }

async function getData() {
  // ponytail: search moved to SEARCH_API; only protocol domains are kept for the allow/fuzzy lists
  const rawProtocols = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocolDomains: string[] = (rawProtocols["protocols"] ?? [])
    .map((x: any) => {
      try {
        const url = x.referralUrl || x.url;
        if (!url) return null;
        return new URL(url).hostname.replace("www.", "");
      } catch (error) {
        return null;
      }
    })
    .filter((x: string | null): x is string => x !== null)
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
  // protocols often list only a subdomain (app.hyperliquid.xyz); trust the registrable root too so hyperliquid.xyz isn't "unknown"
  const protocolRoots = protocolDomains.map((d) => psl.get(d)).filter((d): d is string => !!d)
  // explorers we inject into are first-party by definition; whitelist them so they never show as unknown
  const explorerDomains = Object.keys(EXPLORER_CHAIN_PREFIX_MAP)
  const allowedDomains = getUniqueItems(metamaskAllowedDomains, protocolDomains, protocolRoots, defillamaDomains, explorerDomains, ['x.com'])
  const blockedDomains = getUniqueItems(metamaskBlockedDomains, defillamaBlockedDomains)
  const fuzzyDomains = getUniqueItems(metamaskFuzzyDomains, protocolDomains, defillamaDomains, defillamaFuzzyDomains)
  return {
    allowedDomains,
    blockedDomains,
    fuzzyDomains,
  }
}

function getUniqueItems(...arrays: string[][]): string[] {
  const allItems = arrays.flat()
  return [...new Set(allItems)]
}

export async function updateDb() {
  const res = await fetchData({
    key: cacheKey,
    updateFrequency: 60 * 60, // update every 60 minutes
    getData,
  })
  // fetchData returns undefined/{} while another fetch is in flight or on error; keep what we have
  if (!res?.allowedDomains && !res?.blockedDomains) return { allowedDomainsDb, blockedDomainsDb, fuzzyDomainsDb }
  const { allowedDomains = [], blockedDomains = [], fuzzyDomains = [] } = res;
  allowedDomainsDb.data = new Set([...allowedDomains, ...LOCAL_ALLOWED_DOMAINS]);
  blockedDomainsDb.data = new Set([...blockedDomains, ...LOCAL_BLOCKED_DOMAINS]);
  fuzzyDomainsDb.data = fuzzyDomains;
  dbVersion.n++;
  return { allowedDomainsDb, blockedDomainsDb, fuzzyDomainsDb }
}

// Regular update every 60 minutes for main data
Browser.alarms.create("updateDomainDbs", { periodInMinutes: 60 });

Browser.alarms.onAlarm.addListener(async (a) => {
  switch (a.name) {
    case "updateDomainDbs":
      await updateDb();
      break;
  }
})

async function startupTasks() {
  await updateDb();
  Browser.action.setIcon({ path: cute });
}

Browser.runtime.onInstalled.addListener(startupTasks)
Browser.runtime.onStartup.addListener(startupTasks)

import { fetchData } from './storage'
import { version } from '../../../package.json'
import Browser from "webextension-polyfill";
import cute from "@assets/img/memes/cute-128.png";

import {
  PROTOCOLS_API,
  METAMASK_LIST_CONFIG_API,
  DEFILLAMA_DIRECTORY_API,
  PROTOCOL_TVL_THRESHOLD,
} from "./constants";

export interface Protocol {
  url: string;
  tvl?: number;
}

export const blockedDomainsDb: {
  data: Set<string>
} = {
  data: new Set()
}

export const fuzzyDomainsDb: {
  data: string[]
} = {
  data: []
}

export const allowedDomainsDb: {
  data: Set<string>
} = {
  data: new Set()
}

const cacheKey = 'cache-v' + version

async function getData() {
  console.time(cacheKey)
  const rawProtocols = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocols = (
    (rawProtocols["protocols"]?.map((x: any) => ({
      url: x.url,
      tvl: x.tvl || 0,
    })) ?? []) as Protocol[]
  ).filter((x) => x.tvl >= PROTOCOL_TVL_THRESHOLD);
  const protocolDomains = protocols
    .map((x) => {
      try {
        if (!x.url) return null;
        return new URL(x.url).hostname.replace("www.", "");
      } catch (error) {
        console.log("updateDomainDbs", "error", error);
        return null;
      }
    })
    .filter((x) => x !== null)
  console.log("updateDomainDbs", "protocolDomains", protocolDomains.length);
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
  const allowedDomains = getUniqueItems(metamaskAllowedDomains, protocolDomains, defillamaDomains, ['x.com'])
  console.log("allowedDomainsDb", allowedDomains.length);

  const blockedDomains = getUniqueItems(metamaskBlockedDomains, defillamaBlockedDomains)
  console.log("blockedDomainsDb", blockedDomains.length);

  const fuzzyDomains = getUniqueItems(metamaskFuzzyDomains, protocolDomains, defillamaDomains, defillamaFuzzyDomains)
  console.log("fuzzyDomainsDb", await fuzzyDomains.length);

  console.timeEnd(cacheKey)
  return {
    allowedDomains,
    blockedDomains,
    fuzzyDomains,
  }
}

function getUniqueItems(...arrays) {
  const allItems = arrays.flat()
  return [...new Set(allItems)]

}

async function updateDb() {
  const {
    allowedDomains = [],
    blockedDomains = [],
    fuzzyDomains = [],
  } = await fetchData({
    key: cacheKey,
    updateFrequency: 60 * 60 * 4, // update every 4 hours
    getData,
  })
  allowedDomainsDb.data = new Set(allowedDomains)
  blockedDomainsDb.data = new Set(blockedDomains)
  fuzzyDomainsDb.data = fuzzyDomains
}

updateDb()
// setInterval(updateDb, 1000 * 6 * 10) // run every 10 minutes
Browser.alarms.create("updateDomainDbs", { periodInMinutes: 6 * 60 }); // update every 6 hours

Browser.alarms.onAlarm.addListener(async (a) => {
  switch (a.name) {
    case "updateDomainDbs":
      await updateDb();
      break;
  }
})

async function startupTasks() {
  console.time("startupTasks");
  await updateDb();
  Browser.action.setIcon({ path: cute });
  console.timeEnd("startupTasks");
}

Browser.runtime.onInstalled.addListener(startupTasks)
Browser.runtime.onStartup.addListener(startupTasks)
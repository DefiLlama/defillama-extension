console.log("background loaded");

import Browser from "webextension-polyfill";

import cute from "@assets/img/memes/cute-128.png";
import gib from "@assets/img/memes/gib-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";
import que from "@assets/img/memes/que-128.png";
import upOnly from "@assets/img/memes/up-only-128.png";

import { Coin, Protocol, coinsDb, protocolsDb, allowedDomainsDb, blockedDomainsDb, fuzzyDomainsDb } from "../libs/db";
import { PROTOCOLS_API, METAMASK_LIST_CONFIG_API, DEFILLAMA_DIRECTORY_API } from "../libs/constants";
import { getStorage } from "../libs/helpers";
import { checkDomain } from "../libs/phishing-detector";

startupTasks();

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await Browser.tabs.query(queryOptions);
  return tab;
}

async function handlePhishingCheck() {
  const phishingDetector = await getStorage("local", "settings:phishingDetector", true);
  if (!phishingDetector) {
    Browser.action.setIcon({ path: cute });
    return;
  }

  let isPhishing = false;
  let isTrusted = false;
  let reason = "Unknown website";
  const tab = await getCurrentTab();
  try {
    const url = tab.url;
    if (url.startsWith("https://metamask.github.io/phishing-warning")) {
      // already captured and redirected to metamask phishing warning page
      isPhishing = true;
      reason = "Phishing detected by Metamask";
    } else {
      const domain = new URL(url).hostname.replace("www.", "");
      const res = await checkDomain(domain);
      console.log("checkDomain", res);
      isPhishing = res.result;
      if (isPhishing) {
        switch (res.type) {
          case "blocked":
            reason = "Website is blacklisted";
            break;
          case "fuzzy":
            reason = `Website impersonating ${res.extra}`;
            break;
          default:
            reason = "Suspicious website detected";
        }
      } else {
        switch (res.type) {
          case "allowed":
            isTrusted = true;
            reason = "Website is whitelisted";
            break;
          default:
            reason = "Unknown website";
        }
      }
    }
  } catch (error) {
    console.log("handlePhishingCheck error", error);
    isTrusted = false;
    isPhishing = false;
    reason = "Invalid URL";
  }

  if (isTrusted) {
    Browser.action.setIcon({ path: upOnly });
    Browser.action.setTitle({ title: reason });
    return;
  }

  if (isPhishing) {
    Browser.action.setIcon({ path: maxPain });
    Browser.action.setTitle({ title: reason });
  } else {
    Browser.action.setIcon({ path: que });
    Browser.action.setTitle({ title: reason });
  }
}

/**
 * Update the coinsDb with the top 2500 coins from coingecko ranked by market cap
 */
export async function updateCoinsDb() {
  const getCoingeckoCoinsMarketApi = (page = 1) =>
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false`;

  for (let page = 1; page <= 10; page++) {
    const response = await fetch(getCoingeckoCoinsMarketApi(page));
    const coins: Coin[] = (await response.json()).map((c: Coin) => ({
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      market_cap: c.market_cap,
      total_volume: c.total_volume,
      last_updated: c.last_updated,
    }));
    const result = await coinsDb.coins.bulkPut(coins);
    console.log("updateCoinsDb", result);
  }
}

export async function updateProtocolsDb() {
  const raw = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocols = (raw["protocols"]?.map((x: any) => ({
    name: x.name,
    url: x.url,
    logo: x.logo,
    category: x.category,
    tvl: x.tvl,
  })) ?? []) as Protocol[];
  const result = await protocolsDb.protocols.bulkPut(protocols);
  console.log("updateProtocolsDb", result);
}

export async function updateDomainDbs() {
  console.log("updateDomainDbs", "start");
  const rawProtocols = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocols = (rawProtocols["protocols"]?.map((x: any) => ({
    name: x.name,
    url: x.url,
    logo: x.logo,
    category: x.category,
    tvl: x.tvl,
  })) ?? []) as Protocol[];
  const protocolDomains = protocols
    .map((x) => {
      try {
        return new URL(x.url).hostname.replace("www.", "");
      } catch (error) {
        console.log("updateDomainDbs", "error", error);
        return null;
      }
    })
    .filter((x) => x !== null)
    .map((x) => ({ domain: x }));
  const metamaskLists = (await fetch(METAMASK_LIST_CONFIG_API).then((res) => res.json())) as {
    fuzzylist: string[];
    whitelist: string[];
    blacklist: string[];
  };
  const metamaskFuzzyDomains = metamaskLists.fuzzylist.map((x) => ({ domain: x }));
  const metamaskAllowedDomains = metamaskLists.whitelist.map((x) => ({ domain: x }));
  const metamaskBlockedDomains = metamaskLists.blacklist.map((x) => ({ domain: x }));
  const rawDefillamaDirectory = (await fetch(DEFILLAMA_DIRECTORY_API).then((res) => res.json())) as {
    name: string;
    url: string;
  }[];
  const defillamaDomains = rawDefillamaDirectory
    .map((x) => new URL(x.url).hostname.replace("www.", ""))
    .map((x) => ({ domain: x }));
  allowedDomainsDb.domains.bulkPut(protocolDomains);
  allowedDomainsDb.domains.bulkPut(metamaskAllowedDomains);
  allowedDomainsDb.domains.bulkPut(defillamaDomains);
  blockedDomainsDb.domains.bulkPut(metamaskBlockedDomains);
  fuzzyDomainsDb.domains.bulkPut(metamaskFuzzyDomains);
  fuzzyDomainsDb.domains.bulkPut(metamaskAllowedDomains);
  fuzzyDomainsDb.domains.bulkPut(protocolDomains);
  fuzzyDomainsDb.domains.bulkPut(defillamaDomains);
  console.log("updateDomainDbs", "done");
  console.log("allowedDomainsDb", await allowedDomainsDb.domains.count());
  console.log("blockedDomainsDb", await blockedDomainsDb.domains.count());
  console.log("fuzzyDomainsDb", await fuzzyDomainsDb.domains.count());
}

Browser.tabs.onUpdated.addListener(async () => {
  console.log("onUpdated");
  await handlePhishingCheck();
});
Browser.tabs.onActivated.addListener(async () => {
  console.log("onActivated");
  await handlePhishingCheck();
});

function setupUpdateCoinsDb() {
  console.log("setupUpdateCoinsDb");
  Browser.alarms.get("updateCoinsDb").then((a) => {
    if (!a) {
      console.log("setupUpdateCoinsDb", "create");
      updateCoinsDb();
      Browser.alarms.create("updateCoinsDb", { periodInMinutes: 240 }); // update once every 4 hours
    }
  });
}

function setupUpdateProtocolsDb() {
  console.log("setupUpdateProtocolsDb");
  Browser.alarms.get("updateProtocolsDb").then((a) => {
    if (!a) {
      console.log("setupUpdateProtocolsDb", "create");
      updateProtocolsDb();
      Browser.alarms.create("updateProtocolsDb", { periodInMinutes: 240 }); // update once every 4 hours
    }
  });
}

function setupUpdateDomainDbs() {
  console.log("setupUpdateDomainDbs");
  Browser.alarms.get("updateDomainDbs").then((a) => {
    if (!a) {
      console.log("setupUpdateDomainDbs", "create");
      updateDomainDbs();
      Browser.alarms.create("updateDomainDbs", { periodInMinutes: 240 }); // update once every 4 hours
    }
  });
}

function startupTasks() {
  console.log("startupTasks", "start");
  setupUpdateCoinsDb();
  setupUpdateProtocolsDb();
  setupUpdateDomainDbs();
  Browser.action.setIcon({ path: cute });
  console.log("startupTasks", "done");
}

Browser.runtime.onInstalled.addListener(() => {
  startupTasks();
});

Browser.runtime.onStartup.addListener(() => {
  startupTasks();
});

Browser.alarms.onAlarm.addListener(async (a) => {
  switch (a.name) {
    case "updateCoinsDb":
      await updateCoinsDb();
      break;
    case "updateProtocolsDb":
      await updateProtocolsDb();
      break;
    case "updateDomainDbs":
      await updateDomainDbs();
      break;
  }
});

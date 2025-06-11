console.log("background loaded");

import Browser from "webextension-polyfill";

import cute from "@assets/img/memes/cute-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";
import que from "@assets/img/memes/que-128.png";
import upOnly from "@assets/img/memes/up-only-128.png";

import { Protocol, protocolsDb, allowedDomainsDb, blockedDomainsDb, fuzzyDomainsDb } from "../libs/db";
import {
  PROTOCOLS_API,
  METAMASK_LIST_CONFIG_API,
  DEFILLAMA_DIRECTORY_API,
  PROTOCOL_TVL_THRESHOLD,
} from "../libs/constants";
import { getStorage, setStorage } from "../libs/helpers";
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

export async function updateProtocolsDb() {
  const lastUpdate = await getStorage("local", "lastUpdate:protocols", 0);
  const now = Date.now();
  const diff = now - lastUpdate;
  if (diff < 4 * 60 * 60 * 1000) {
    console.log("updateProtocolsDb", `last update was less than ${Math.ceil(diff / 1000 / 60)} minutes ago, skipping`);
    return;
  }

  console.log("updateProtocolsDb", "start");
  await setStorage("local", "lastUpdate:protocols", now);

  const raw = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocols = (raw["protocols"]?.map((x: any) => ({
    name: x.name,
    url: x.url,
    logo: x.logo,
    category: x.category,
    tvl: x.tvl,
  })) ?? []) as Protocol[];
  if (protocols.length === 0) {
    console.log("updateProtocolsDb", "no protocols found");
    return;
  }
  // empty db before updating
  await protocolsDb.protocols.clear();
  const result = await protocolsDb.protocols.bulkPut(protocols);
  console.log("updateProtocolsDb", result);
}

export async function updateDomainDbs() {
  const lastUpdate = await getStorage("local", "lastUpdate:domains", 0);
  const now = Date.now();
  const diff = now - lastUpdate;
  if (diff < 4 * 60 * 60 * 1000) {
    console.log("updateDomainDbs", `last update was less than ${Math.ceil(diff / 1000 / 60)} minutes ago, skipping`);
    return;
  }

  console.log("updateDomainDbs", "start");
  await setStorage("local", "lastUpdate:domains", now);

  const rawProtocols = await fetch(PROTOCOLS_API).then((res) => res.json());
  const protocols = (
    (rawProtocols["protocols"]?.map((x: any) => ({
      name: x.name,
      url: x.url,
      logo: x.logo,
      category: x.category,
      tvl: x.tvl || 0,
    })) ?? []) as Protocol[]
  ).filter((x) => x.tvl >= PROTOCOL_TVL_THRESHOLD);
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
    version: number;
    whitelist: string[];
    blacklist?: string[];
    fuzzylist?: string[];
  };
  const defillamaDomains = rawDefillamaDirectory.whitelist.map((x) => ({ domain: x }));
  const defillamaBlockedDomains = rawDefillamaDirectory.blacklist?.map((x) => ({ domain: x })) ?? [];
  const defillamaFuzzyDomains = rawDefillamaDirectory.fuzzylist?.map((x) => ({ domain: x })) ?? [];
  const allowedDomains = [metamaskAllowedDomains, protocolDomains, defillamaDomains].flat();
  if (allowedDomains.length === 0) {
    console.log("allowedDomainsDb", "no allowed domains fetched, skipping update");
  } else {
    allowedDomainsDb.domains.clear();
    allowedDomainsDb.domains.bulkPut(allowedDomains);
    console.log("allowedDomainsDb", await allowedDomainsDb.domains.count());
  }

  const blockedDomains = [metamaskBlockedDomains, defillamaBlockedDomains].flat();
  if (blockedDomains.length === 0) {
    console.log("blockedDomainsDb", "no blocked domains fetched, skipping update");
  } else {
    blockedDomainsDb.domains.clear();
    blockedDomainsDb.domains.bulkPut(blockedDomains);
    console.log("blockedDomainsDb", await blockedDomainsDb.domains.count());
  }

  const fuzzyDomains = [metamaskFuzzyDomains, protocolDomains, defillamaDomains, defillamaFuzzyDomains].flat();
  if (fuzzyDomains.length === 0) {
    console.log("fuzzyDomainsDb", "no fuzzy domains fetched, skipping update");
  } else {
    fuzzyDomainsDb.domains.clear();
    fuzzyDomainsDb.domains.bulkPut(fuzzyDomains);
    console.log("fuzzyDomainsDb", await fuzzyDomainsDb.domains.count());
  }

  console.log("updateDomainDbs", "done");
}

// monitor updates to the tab, specifically when the user navigates to a new page (new url)
Browser.tabs.onUpdated.addListener(async (tabId, onUpdatedInfo, tab) => {
  // console.log("onUpdated", onUpdatedInfo.status, onUpdatedInfo.url);
  if (onUpdatedInfo.status === "complete" && tab.active) {
    Browser.tabs.sendMessage(tabId, { message: "TabUpdated" });
  }
  await handlePhishingCheck();
});

// monitor tab activations, when the user switches to a different tab that was already open but not active
Browser.tabs.onActivated.addListener(async (onActivatedInfo) => {
  // console.log("onActivated");
  Browser.tabs.sendMessage(onActivatedInfo.tabId, { message: "TabActivated" });
  await handlePhishingCheck();
});

async function setupUpdateProtocolsDb() {
  console.log("setupUpdateProtocolsDb");
  Browser.alarms.get("updateProtocolsDb").then((a) => {
    if (!a) {
      console.log("setupUpdateProtocolsDb", "create");
      updateProtocolsDb();
      Browser.alarms.create("updateProtocolsDb", { periodInMinutes: 4 * 60 }); // update once every 4 hours
    }
  });
}

async function setupUpdateDomainDbs() {
  console.log("setupUpdateDomainDbs");
  Browser.alarms.get("updateDomainDbs").then((a) => {
    if (!a) {
      console.log("setupUpdateDomainDbs", "create");
      updateDomainDbs();
      Browser.alarms.create("updateDomainDbs", { periodInMinutes: 4 * 60 }); // update once every 4 hours
    }
  });
}

function startupTasks() {
  console.log("startupTasks", "start");
  setupUpdateProtocolsDb();
  setupUpdateDomainDbs();
  updateProtocolsDb();
  updateDomainDbs();
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
    case "updateProtocolsDb":
      await updateProtocolsDb();
      break;
    case "updateDomainDbs":
      await updateDomainDbs();
      break;
  }
});

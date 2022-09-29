console.log("background loaded");

import checkForPhishing from "eth-phishing-detect";
import PhishingDetector from "eth-phishing-detect/src/detector";
import detectorConfig from "eth-phishing-detect/src/config.json";

import gib from "@assets/img/memes/gib-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";
import que from "@assets/img/memes/que-128.png";
import upOnly from "@assets/img/memes/up-only-128.png";

import { Coin, Protocol, coinsDb, protocolsDb } from "../libs/db";
import { COINGECKO_COINS_LIST_API, PROTOCOLS_API } from "../libs/constants";

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function handlePhishingCheck() {
  const detector = new PhishingDetector(detectorConfig);

  let isPhishing = false;
  const tab = await getCurrentTab();
  try {
    const url = tab.url;
    if (url.startsWith("https://metamask.github.io/phishing-warning")) {
      // already captured and redirected to metamask phishing warning page
      isPhishing = true;
    } else {
      const domain = new URL(url).hostname.replace("www.", "");
      isPhishing = checkForPhishing(domain);
      console.log("detector", detector.check(domain));
    }
  } catch (error) {
    // ignore error incase of invalid url, just treat as non-phishing
    console.log(error);
  }

  if (isPhishing) {
    chrome.action.setIcon({ path: maxPain });
  } else {
    chrome.action.setIcon({ path: que });
  }

  return isPhishing;
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

chrome.tabs.onUpdated.addListener(async () => {
  console.log("onUpdated");
  await handlePhishingCheck();
});
chrome.tabs.onActivated.addListener(async () => {
  console.log("onActivated");
  await handlePhishingCheck();
});

function setupUpdateCoinsDb() {
  console.log("setupUpdateCoinsDb");
  chrome.alarms.get("updateCoinsDb", async (a) => {
    if (!a) {
      await updateCoinsDb();
      chrome.alarms.create("updateCoinsDb", { periodInMinutes: 240 }); // update once every 4 hours
    }
  });
}

function setupUpdateProtocolsDb() {
  console.log("setupUpdateProtocolsDb");
  chrome.alarms.get("updateProtocolsDb", async (a) => {
    if (!a) {
      await updateProtocolsDb();
      chrome.alarms.create("updateProtocolsDb", { periodInMinutes: 240 }); // update once every 4 hours
    }
  });
}

setupUpdateCoinsDb();
setupUpdateProtocolsDb();

chrome.runtime.onInstalled.addListener(() => {
  setupUpdateCoinsDb();
  setupUpdateProtocolsDb();
});

chrome.runtime.onStartup.addListener(() => {
  setupUpdateCoinsDb();
  setupUpdateProtocolsDb();
});

chrome.alarms.onAlarm.addListener(async (a) => {
  switch (a.name) {
    case "updateCoinsDb":
      await updateCoinsDb();
      break;
    case "updateProtocolsDb":
      await updateProtocolsDb();
      break;
  }
});

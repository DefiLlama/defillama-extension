console.log("background loaded");

import Browser from "webextension-polyfill";

import cute from "@assets/img/memes/cute-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";
import que from "@assets/img/memes/que-128.png";
import upOnly from "@assets/img/memes/up-only-128.png";

import {
  Protocol,
  putProtocolsDb,
  queryProtocolsDb,
  putAllowedDomainsDb,
  putFuzzyDomainsDb,
  putBlockedDomainsDb,
  countAllowedDomainsDb,
  countFuzzyDomainsDb,
  countBlockedDomainsDb,
} from "@src/pages/libs/db";
import {
  PROTOCOLS_API,
  METAMASK_LIST_CONFIG_API,
  DEFILLAMA_DIRECTORY_API,
  PROTOCOL_TVL_THRESHOLD,
  TWITTER_CONFIG_API,
  DB_UPDATE_FREQUENCY,
  DEFAULT_SETTINGS,
  MessageType,
} from "@src/pages/libs/constants";
import { getStorage, setStorage } from "@src/pages/libs/helpers";
import { checkDomain } from "@src/pages/libs/phishing-detector";

// startupTasks();
interface ProtocolsQueryMessage {
  type: MessageType.ProtocolsQuery;
  payload: {
    query: string | null;
  };
}
// extend with new message types if needed
type Message = ProtocolsQueryMessage;

/* Background class that encapsulates all background operations and state */
class Background {
  updateProtocolsDbRunning: boolean;
  updateDomainDbsRunning: boolean;
  updateTwitterConfigRunning: boolean;
  constructor() {
    // those variables are used to know if an update routine is currently running, to avoid launching another at the same time
    this.updateProtocolsDbRunning = false;
    this.updateDomainDbsRunning = false;
    this.updateTwitterConfigRunning = false;

    // listeners to trigger the startup script
    Browser.runtime.onInstalled.addListener(() => {
      this.startupTasks();
    });

    Browser.runtime.onStartup.addListener(() => {
      this.startupTasks();
    });

    // listener for the alarms the startup script sets up
    Browser.alarms.onAlarm.addListener(async (a) => {
      switch (a.name) {
        case "updateProtocolsDb":
          await this.updateProtocolsDb();
          break;
        case "updateDomainDbs":
          await this.updateDomainDbs();
          break;
        case "updateTwitterConfig":
          await this.updateTwitterConfig();
          break;
      }
    });

    // listeners for tab update/activation to trigger phising check
    Browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      await this.handlePhishingCheck(tabId);
    });
    Browser.tabs.onActivated.addListener(async (activeInfo) => {
      await this.handlePhishingCheck(activeInfo.tabId);
    });
  }

  async getCurrentTab() {
    const queryOptions = { active: true, currentWindow: true };
    const [tab] = await Browser.tabs.query(queryOptions);
    return tab;
  }

  // checks if the current tab is a phising site
  async handlePhishingCheck(tabId: number) {
    const tab = await this.getCurrentTab();
    // This method can be triggered by site updates, and those can come from other tabs than the one being displayed
    // (for example, Tradingview updates the title of the page with the current price, which happens very often)
    // in that case (tabId !== tab.id) so the check is skipped
    if (!tab || !tab.url || tabId !== tab.id) {
      return;
    }
    console.log("phishing check");
    const phishingDetector = await getStorage("local", "settings:phishingDetector", DEFAULT_SETTINGS.PHISHING_DETECTOR);
    if (!phishingDetector) {
      Browser.action.setIcon({ path: cute });
      return;
    }

    let isPhishing = false;
    let isTrusted = false;
    let reason = "Unknown website";

    try {
      const url = tab.url;
      console.log("url", url);
      if (url.startsWith("https://metamask.github.io/phishing-warning")) {
        // already captured and redirected to metamask phishing warning page
        isPhishing = true;
        reason = "Phishing detected by Metamask";
      } else if (url.startsWith("chrome://")) {
        // whitelist the new tab page
        if (url === "chrome://newtab/") {
          isTrusted = true;
        }
        isPhishing = false;
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

  // method that fetches the protocols listed on DefiLlama, then puts them in the Dexie DB
  async updateProtocolsDb() {
    if (this.updateProtocolsDbRunning) {
      return;
    }
    this.updateProtocolsDbRunning = true;
    try {
      const raw = await fetch(PROTOCOLS_API).then((res) => res.json());
      const updateId = crypto.randomUUID();
      const protocols = (raw["protocols"]?.map((x: any) => ({
        id: x.defillamaId,
        name: x.name,
        url: x.url,
        logo: x.logo,
        category: x.category,
        symbol: x.symbol,
        tvl: x.tvl ?? 0,
        updateId,
      })) ?? []) as Protocol[];
      if (protocols.length === 0) {
        console.log("updateProtocolsDb", "no protocols found");
      } else {
        await putProtocolsDb(protocols, updateId);
      }
    } catch (error) {
      console.error("updateProtocolsDb error", error);
    }
    this.updateProtocolsDbRunning = false;
  }

  // method that fetches blocked/fuzzy/allowed domains lists from DefiLlama and Metamask, then puts them in the Dexie DB
  async updateDomainDbs() {
    if (this.updateDomainDbsRunning) {
      return;
    }
    this.updateDomainDbsRunning = true;
    try {
      console.log("updateDomainDbs", "start");
      const rawProtocols = await fetch(PROTOCOLS_API).then((res) => res.json());
      const protocols = (
        (rawProtocols["protocols"]?.map((x: any) => ({
          name: x.name,
          url: x.url,
          logo: x.logo,
          category: x.category,
          tvl: x.tvl || 0,
        })) ?? []) as Protocol[]
      )
        // protocols with a TVL < to a certain threshold may have been added to DefiLlama,
        // but could still be scams, so don't display them as safe yet
        .filter((x) => x.tvl >= PROTOCOL_TVL_THRESHOLD);
      const protocolDomains = protocols
        .map((x) => {
          try {
            return new URL(x.url).hostname.replace("www.", "");
          } catch (error) {
            console.log("updateDomainDbs domains mapping error", error);
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
      const updateId = crypto.randomUUID();
      const allowedDomains = [metamaskAllowedDomains, protocolDomains, defillamaDomains]
        .flat()
        .map((x) => ({ domain: x, updateId }));
      if (allowedDomains.length === 0) {
        console.log("allowedDomainsDb", "no allowed domains fetched, skipping update");
      } else {
        try {
          await putAllowedDomainsDb(allowedDomains, updateId).then(async () => {
            const count = await countAllowedDomainsDb();
            console.log("allowedDomainsDb", count);
          });
        } catch (error) {
          console.error("putAllowedDomainsDb error", error);
        }
      }

      const blockedDomains = [metamaskBlockedDomains, defillamaBlockedDomains]
        .flat()
        .map((x) => ({ domain: x, updateId }));
      if (blockedDomains.length === 0) {
        console.log("blockedDomainsDb", "no blocked domains fetched, skipping update");
      } else {
        try {
          await putBlockedDomainsDb(blockedDomains, updateId).then(async () => {
            const count = await countBlockedDomainsDb();
            console.log("blockedDomainsDb", count);
          });
        } catch (error) {
          console.error("putBlockedDomainsDb error", error);
        }
      }

      const fuzzyDomains = [metamaskFuzzyDomains, protocolDomains, defillamaDomains, defillamaFuzzyDomains]
        .flat()
        .map((x) => ({ domain: x, updateId }));
      if (fuzzyDomains.length === 0) {
        console.log("fuzzyDomainsDb", "no fuzzy domains fetched, skipping update");
      } else {
        try {
          await putFuzzyDomainsDb(fuzzyDomains, updateId).then(async () => {
            const count = await countFuzzyDomainsDb();
            console.log("fuzzyDomainsDb", count);
          });
        } catch (error) {
          console.error("putFuzzyDomainsDb error", error);
        }
      }

      console.log("updateDomainDbs", "done");
    } catch (error) {
      console.error("updateDomainDbs error", error);
    }
    this.updateDomainDbsRunning = false;
  }

  // method that fetches whitelisted/blacklisted twitter handles lists
  async updateTwitterConfig() {
    if (this.updateTwitterConfigRunning) {
      return;
    }
    this.updateTwitterConfigRunning = true;
    try {
      const twitterConfig = await fetch(TWITTER_CONFIG_API).then((res) => res.json());
      setStorage("local", "twitterConfig", twitterConfig);
    } catch (error) {
      console.error("updateTwitterConfigDb error", error);
    }
    this.updateTwitterConfigRunning = false;
  }

  // initializing method that programs the protocols DB update routine to run every x hours, and runs it once if the alarms wasn't set before
  // clear the alarm if it existed before, so if the config changed (alarm interval) it gets set to the new interval
  setupUpdateProtocolsDb() {
    console.log("setupUpdateProtocolsDb");
    Browser.alarms.get("updateProtocolsDb").then((a) => {
      if (!a) {
        console.log("setupUpdateProtocolsDb", "create");
        this.updateProtocolsDb();
      } else {
        console.log("setupUpdateProtocolsDb", "recreate");
        Browser.alarms.clear("updateProtocolsDb");
      }
      Browser.alarms.create("updateProtocolsDb", { periodInMinutes: DB_UPDATE_FREQUENCY }); // update once every 2 hours
    });
  }

  // initializing method that programs the domains DBs update routine to run every x hours, and runs it once if the alarms wasn't set before
  // clear the alarm if it existed before, so if the config changed (alarm interval) it gets set to the new interval
  setupUpdateDomainDbs() {
    console.log("setupUpdateDomainDbs");
    Browser.alarms.get("updateDomainDbs").then((a) => {
      if (!a) {
        console.log("setupUpdateDomainDbs", "create");
        this.updateDomainDbs();
      } else {
        console.log("setupUpdateDomainDbs", "recreate");
        Browser.alarms.clear("updateDomainDbs");
      }
      Browser.alarms.create("updateDomainDbs", { periodInMinutes: DB_UPDATE_FREQUENCY }); // update once every 2 hours
    });
  }

  // initializing method that programs the twitter DB update routine to run every x hours, and runs it once if the alarms wasn't set before
  // clear the alarm if it existed before, so if the config changed (alarm interval) it gets set to the new interval
  setupUpdateTwitterConfig() {
    console.log("setupUpdateTwitterConfig");
    Browser.alarms.get("updateTwitterConfig").then((a) => {
      if (!a) {
        console.log("setupUpdateTwitterConfig", "create");
        this.updateTwitterConfig();
      } else {
        console.log("setupUpdateTwitterConfig", "recreate");
        Browser.alarms.clear("updateTwitterConfig");
      }
      Browser.alarms.create("updateTwitterConfig", { periodInMinutes: DB_UPDATE_FREQUENCY }); // update once every 2 hours
    });
  }

  // message listener, catches messages coming from new tab/content script/popup
  setupMessageListeners() {
    Browser.runtime.onMessage.addListener(async (message: Message) => {
      // messages that request a run of the protocols query (from new tab page)
      if (message.type === MessageType.ProtocolsQuery) {
        const res = await queryProtocolsDb(message.payload.query);

        return res;
      }
    });
  }

  // startup routine that sets up the databases and their alarms
  startupTasks() {
    console.log("startupTasks", "start");
    this.setupUpdateProtocolsDb();
    this.setupUpdateDomainDbs();
    this.setupUpdateTwitterConfig();
    this.setupMessageListeners();
    Browser.action.setIcon({ path: cute });
    console.log("startupTasks", "done");
  }
}

new Background();

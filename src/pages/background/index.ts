import Browser from "webextension-polyfill";
import { checkAndLoadDataIfNeeded, allowedDomainsDb, blockedDomainsDb, curatedDomainsDb } from "../libs/db";

import cute from "@assets/img/memes/cute-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";
import que from "@assets/img/memes/que-128.png";
import upOnly from "@assets/img/memes/up-only-128.png";

import { getStorage } from "../libs/helpers";
import { checkDomain } from "../libs/phishing-detector";

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await Browser.tabs.query(queryOptions);
  return tab;
}

async function initBackground() {
  await checkAndLoadDataIfNeeded();
}

const ready = initBackground().catch(() => {});
Browser.runtime.onMessage.addListener((message, sender) => {
  try {
    if (message?.type === "CHECK_CURRENT_DOMAIN" && sender?.tab) {
      handlePhishingCheck("contentScriptRequest", sender.tab).catch(() => {});
    }
    if (message?.type === "GET_CURRENT_DOMAIN_STATUS") {
      // popup asks for the active tab's verdict; returning a promise sends it as the response
      return getCurrentDomainStatus();
    }
    if (message?.type === "VERIFY_URLS") {
      return verifyUrls(Array.isArray(message.urls) ? message.urls : []);
    }
  } catch (error) {
  }
});

async function getCurrentDomainStatus() {
  const phishingDetector = await getStorage("local", "settings:phishingDetector", true);
  const { isBlocked, isTrusted, reason, tab } = await handleDomainCheck("popup");
  let hostname = "";
  try {
    hostname = new URL(tab?.url ?? "").hostname;
  } catch {}
  return { hostname, isBlocked, isTrusted, reason: phishingDetector ? reason : "Phishing detection disabled" };
}

// A saved quick link is only trusted if its exact hostname is on the DefiLlama allowlist and not on the blocklist.
// Stored links are re-checked every popup open, so a tampered/look-alike entry can never render as clickable.
async function verifyUrls(urls: string[]): Promise<Record<string, boolean>> {
  await ready;
  const out: Record<string, boolean> = {};
  for (const u of urls) {
    try {
      const { protocol, hostname } = new URL(u);
      const host = hostname.replace(/^www\./, "");
      // same precedence as checkDomainInLists, but exact hostname only
      out[u] = protocol === "https:" && (curatedDomainsDb.data.has(host) || (allowedDomainsDb.data.has(host) && !blockedDomainsDb.data.has(host)));
    } catch {
      out[u] = false;
    }
  }
  return out;
}

async function handleDomainCheck(trigger: string, tab?: Browser.Tabs.Tab) {
  try {
    await ready;
    if (!tab) {
      tab = await getCurrentTab();
    }

    if (!tab?.url) {
      return { isBlocked: false, isTrusted: false, reason: "No URL available", tab };
    }

    const url = tab.url;
    if (url.startsWith("https://metamask.github.io/phishing-warning")) {
      return {
        isBlocked: true,
        isTrusted: false,
        reason: "Phishing detected by Metamask",
        tab
      };
    }
    if (url.startsWith("chrome://") || url.startsWith("moz-extension://") || url.startsWith("chrome-extension://")) {
      return { isBlocked: false, isTrusted: false, reason: "Browser internal page", tab };
    }

    let hostname: string;
    try {
      hostname = new URL(url).hostname;
      if (!hostname) {
        return { isBlocked: false, isTrusted: false, reason: "Invalid hostname", tab };
      }
    } catch (error) {
      return { isBlocked: false, isTrusted: false, reason: "Invalid URL format", tab };
    }

    // checkDomain derives the root domain itself; passing the full hostname lets subdomain blocklist entries match
    const phishingFuzzyMatch = await getStorage("local", "settings:phishingFuzzyMatch", false);
    const res = await checkDomain(hostname.replace(/^www\./, ""), phishingFuzzyMatch);

    // lists still downloading (first install / reload): local blocklist hits above still warn, everything else says loading
    if (!res.result && allowedDomainsDb.data.size === 0) {
      return { isBlocked: false, isTrusted: false, reason: "Loading domain lists…", tab };
    }

    if (res.result) {
      let reason: string;
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
      return { isBlocked: true, isTrusted: false, reason, tab };
    }

    const isTrusted = res.type === "allowed";
    const reason = isTrusted ? "Website is whitelisted" : "Unknown website";

    return { isBlocked: false, isTrusted, reason, tab };
  } catch (error) {
    return { isBlocked: false, isTrusted: false, reason: "Error checking domain", tab };
  }
}

async function handlePhishingCheck(trigger: string, tab?: Browser.Tabs.Tab) {
  // Check if phishing detection is enabled
  const phishingDetector = await getStorage("local", "settings:phishingDetector", true);
  if (!phishingDetector) {
    // Reset to default icon when phishing detection is disabled
    if (!tab) {
      tab = await getCurrentTab();
    }
    if (tab?.active) {
      Browser.action.setIcon({ path: cute });
      Browser.action.setTitle({ title: "DefiLlama" });
    }
    return;
  }

  const domainResult = await handleDomainCheck(trigger, tab);
  const { isBlocked, isTrusted, reason } = domainResult;
  tab = domainResult.tab;

  if (isBlocked) {
    // Always send warning message for blocked sites, regardless of active status
    if (tab?.id) {
      try {
        await Browser.tabs.sendMessage(tab.id, {
          type: "DOMAIN_STATUS",
          status: "blocked",
          reason
        });
      } catch (error) {
        // Tab might be closed or content script not ready - fail silently
      }
    }

    // Only update icon if this is the active tab
    if (tab?.active) {
      Browser.action.setIcon({ path: maxPain });
      Browser.action.setTitle({ title: reason });
    }
    return;
  }

  // Only update icon for active tabs to prevent background tab updates affecting current icon
  if (tab?.active) {
    if (isTrusted) {
      Browser.action.setIcon({ path: upOnly });
      Browser.action.setTitle({ title: reason });
    } else {
      Browser.action.setIcon({ path: que });
      Browser.action.setTitle({ title: reason });
    }
  }
}

let lastCheckKey = "";

Browser.tabs.onUpdated.addListener(async (tabId, onUpdatedInfo, tab) => {
  try {
    if (onUpdatedInfo.status === "complete" && tab.active) {
      try {
        await Browser.tabs.sendMessage(tabId, { message: "TabUpdated" });
      } catch {
        // Content script might not be ready yet
      }
    }

    if (onUpdatedInfo.url || onUpdatedInfo.status === "complete") {
      if (!tab?.active) return;

      const key = `${tab.id}-${tab.url}`;
      if (lastCheckKey === key) {
        return;
      }
      lastCheckKey = key;
      await handlePhishingCheck("tabUpdate", tab);
    }
  } catch (error) {
    // Silently handle any tab update errors
  }
});

Browser.tabs.onActivated.addListener(async (onActivatedInfo) => {
  try {
    try {
      await Browser.tabs.sendMessage(onActivatedInfo.tabId, { message: "TabActivated" });
    } catch {
      // Content script might not be ready
    }

    const tab = await Browser.tabs.get(onActivatedInfo.tabId);
    await handlePhishingCheck("tabActivated", tab);
  } catch (error) {
    // Silently handle tab activation errors
  }
});

Browser.windows.onFocusChanged.addListener(async (windowId) => {
  try {
    if (windowId === Browser.windows.WINDOW_ID_NONE) return;
    const tab = await getCurrentTab();
    if (tab) {
      try {
        await Browser.tabs.sendMessage(tab.id, { message: "TabActivated" });
      } catch {
        // Content script might not be ready
      }
      await handlePhishingCheck("windowFocused", tab);
    }
  } catch (error) {
    // Silently handle window focus errors
  }
});

Browser.tabs.onCreated.addListener(async (tab) => {
  try {
    if (tab.url && tab.active) {
      await handlePhishingCheck("tabCreated", tab);
    }
  } catch (error) {
    // Silently handle tab creation errors
  }
});

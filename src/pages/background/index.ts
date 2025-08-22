import Browser from "webextension-polyfill";
import * as psl from "psl";
import { checkAndLoadDataIfNeeded } from "../libs/db";

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

initBackground();
Browser.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "CHECK_CURRENT_DOMAIN" && sender.tab) {
    await handlePhishingCheck('contentScriptRequest', sender.tab);
  }
});

async function handleDomainCheck(trigger: string, tab?: Browser.Tabs.Tab) {
  try {
    if (!tab) {
      tab = await getCurrentTab();
    }

    if (!tab?.url) {
      return { isBlocked: false, isTrusted: false, reason: "No URL available", tab };
    }

    const url = tab.url;
    if (url.startsWith("https://metamask.github.io/phishing-warning/v5.0.0")) {
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

    const hostname = new URL(url).hostname;
    if (!hostname) {
      return { isBlocked: false, isTrusted: false, reason: "Invalid hostname", tab };
    }

    const parsed = psl.parse(hostname);
    const domain = (parsed && 'domain' in parsed && parsed.domain) || hostname.replace("www.", "");

    const res = await checkDomain(domain);
    if (res.result) {
      const reason = res.type === "blocked" ? "Website is blacklisted" : "Suspicious website detected";
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
  const phishingDetector = await getStorage("local", "settings:phishingDetector", true);

  const domainResult = await handleDomainCheck(trigger, tab);
  const { isBlocked, isTrusted, reason } = domainResult;
  tab = domainResult.tab;
  if (isBlocked) {
    Browser.action.setIcon({ path: maxPain });
    Browser.action.setTitle({ title: reason });

    if (tab?.id) {
      Browser.tabs.sendMessage(tab.id, {
        type: "DOMAIN_STATUS",
        status: "blocked",
        reason: reason
      });
    }
    return;
  }


  if (!phishingDetector) {
    await Browser.action.setIcon({ path: cute });
    return;
  }

  if (isTrusted) {
    Browser.action.setIcon({ path: upOnly });
    Browser.action.setTitle({ title: reason });
  } else {
    Browser.action.setIcon({ path: que });
    Browser.action.setTitle({ title: reason });
  }
}

let lastCheckKey = "";


Browser.tabs.onUpdated.addListener(async (tabId, onUpdatedInfo, tab) => {
  if (onUpdatedInfo.status === "complete" && tab.active) {
    Browser.tabs.sendMessage(tabId, { message: "TabUpdated" });
  }

  if (onUpdatedInfo.url || onUpdatedInfo.status === "complete") {
    if (!tab?.active) return;

    const key = `${tab.id}-${tab.url}`;
    if (lastCheckKey === key) {
      return;
    }
    lastCheckKey = key;
    await handlePhishingCheck('tabUpdate', tab);
  }
});


Browser.tabs.onActivated.addListener(async (onActivatedInfo) => {
  Browser.tabs.sendMessage(onActivatedInfo.tabId, { message: "TabActivated" });
  const tab = await Browser.tabs.get(onActivatedInfo.tabId);
  await handlePhishingCheck('tabActivated', tab);
});


Browser.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === Browser.windows.WINDOW_ID_NONE) return;
  const tab = await getCurrentTab();
  if (tab) {
    Browser.tabs.sendMessage(tab.id, { message: "TabActivated" });
    await handlePhishingCheck('windowFocused', tab);
  }
});


Browser.tabs.onCreated.addListener(async (tab) => {
  if (tab.url && tab.active) {
    await handlePhishingCheck('tabCreated', tab);
  }
});

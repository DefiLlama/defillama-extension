console.log("background loaded");

import Browser from "webextension-polyfill";

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

async function handlePhishingCheck(trigger: string, tab?: Browser.Tabs.Tab) {
  const phishingDetector = await getStorage("local", "settings:phishingDetector", true);
  if (!phishingDetector) {
    await Browser.action.setIcon({ path: cute });
    return;
  }

  let isPhishing = false;
  let isTrusted = false;
  let reason = "Unknown website";
  try {
    if (!tab)
      tab = await getCurrentTab();

    if (!tab) {
      console.log('Unable to get current tab');
      return;
    }
    const url = tab.url;
    // https://metamask.github.io/phishing-warning/v${
    // eslint-disable-next-line node/global-require
    // require('@metamask/phishing-warning/package.json').version
    // }/
    if (url.startsWith("https://metamask.github.io/phishing-warning/v5.0.0")) {
      // already captured and redirected to metamask phishing warning page
      isPhishing = true;
      reason = "Phishing detected by Metamask";
    } else {
      const domain = new URL(url).hostname.replace("www.", "");
      if (!domain) return;
      const res = await checkDomain(domain);
      console.log("Phishing check result", { domain, res, trigger });
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

let lastCheckKey = "";

// monitor updates to the tab, specifically when the user navigates to a new page (new url)
Browser.tabs.onUpdated.addListener(async (tabId, onUpdatedInfo, tab) => {
  if (onUpdatedInfo.status === "complete" && tab.active) {
    Browser.tabs.sendMessage(tabId, { message: "TabUpdated" });
  }

  if (!tab?.active) return; // only handle active tabs
  const key = `${tab.id}-${tab.url}`;
  if (lastCheckKey === key) {
    return;
  }
  lastCheckKey = key;
  await handlePhishingCheck('tabUpdate', tab);
});

// monitor tab activations, when the user switches to a different tab that was already open but not active
Browser.tabs.onActivated.addListener(async (onActivatedInfo) => {
  Browser.tabs.sendMessage(onActivatedInfo.tabId, { message: "TabActivated" });
  const tab = await Browser.tabs.get(onActivatedInfo.tabId);
  await handlePhishingCheck('tabActivated', tab);
});

// monitor window focus changes, when the user switches between browser windows
Browser.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === Browser.windows.WINDOW_ID_NONE) return; // no window focused
    const tab = await getCurrentTab();
  if (tab) {
    Browser.tabs.sendMessage(tab.id, { message: "TabActivated" });
    await handlePhishingCheck('windowFocused', tab);
  }
});

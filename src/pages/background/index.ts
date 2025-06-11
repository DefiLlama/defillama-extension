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

async function handlePhishingCheck() {
  const phishingDetector = await getStorage("local", "settings:phishingDetector", true);
  if (!phishingDetector) {
    await Browser.action.setIcon({ path: cute });
    return;
  }

  let isPhishing = false;
  let isTrusted = false;
  let reason = "Unknown website";
  const tab = await getCurrentTab();
  try {
    if (!tab) {
      console.log('Unable to get current tab');
      return;
    }
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

// monitor updates to the tab, specifically when the user navigates to a new page (new url)
Browser.tabs.onUpdated.addListener(async (tabId, onUpdatedInfo, tab) => {
  // console.log("onUpdated", onUpdatedInfo.status, onUpdatedInfo.url);
  if (onUpdatedInfo.status === "complete" && tab.active) {
    await Browser.tabs.sendMessage(tabId, { message: "TabUpdated" });
  }
  await handlePhishingCheck();
});

// monitor tab activations, when the user switches to a different tab that was already open but not active
Browser.tabs.onActivated.addListener(async (onActivatedInfo) => {
  // console.log("onActivated");
  await Browser.tabs.sendMessage(onActivatedInfo.tabId, { message: "TabActivated" });
  await handlePhishingCheck();
});

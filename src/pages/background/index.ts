console.log("background loaded");

import checkForPhishing from "eth-phishing-detect";
import gib from "@assets/img/memes/gib-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";
import que from "@assets/img/memes/que-128.png";
import upOnly from "@assets/img/memes/up-only-128.png";

import PhishingDetector from "eth-phishing-detect/src/detector";
import detectorConfig from "eth-phishing-detect/src/config.json";

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

chrome.tabs.onUpdated.addListener(async () => {
  console.log("onUpdated");
  await handlePhishingCheck();
});
chrome.tabs.onActivated.addListener(async () => {
  console.log("onActivated");
  await handlePhishingCheck();
});

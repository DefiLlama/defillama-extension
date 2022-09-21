import checkForPhishing from "eth-phishing-detect";
import gib from "@assets/img/memes/gib-128.png";
import maxPain from "@assets/img/memes/max-pain-128.png";

console.log("background loaded");

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

async function handlePhishingCheck() {
  let isPhishing = false;
  const tab = await getCurrentTab();
  const url = tab.url;

  if (url.startsWith("https://metamask.github.io/phishing-warning")) {
    // already captured and redirected to metamask phishing warning page
    isPhishing = true;
  } else {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      isPhishing = checkForPhishing(domain);
    } catch (error) {
      // ignore error incase of invalid url, just treat as non-phishing
      console.error(error);
    }
  }

  if (isPhishing) {
    chrome.action.setIcon({ path: maxPain });
  } else {
    chrome.action.setIcon({ path: gib });
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

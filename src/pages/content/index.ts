import Browser from "webextension-polyfill";
import * as psl from "psl";
import { EXPLORER_CHAIN_PREFIX_MAP } from "../libs/constants";
import genericEtherscanComponent from "./components/explorers/genericEtherscanComponent";
import initPhishingDetector from "./components/twitter/init";
import { injectWarningBanner } from "./components/WarningBanner";

let hostname = "unknown";
try {
  hostname = new URL(document.baseURI || window.location.href).hostname;
} catch (error) {
  try {
    hostname = window.location.hostname;
  } catch (e) {
    hostname = "unknown";
  }
}
const parsed = psl.parse(hostname);
const host = (parsed && "domain" in parsed && parsed.domain) || hostname;

// Robust message sending with retry logic
async function sendMessageWithRetry(message: any, maxRetries = 3, delay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!Browser.runtime?.id) {
        throw new Error("Extension context invalidated");
      }
      await Browser.runtime.sendMessage(message);
      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (attempt === maxRetries) {
        return;
      }
      if (errorMessage.includes("Extension context invalidated") || errorMessage.includes("message port closed")) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }
}

sendMessageWithRetry({
  type: "CHECK_CURRENT_DOMAIN",
  hostname: hostname,
  url: window.location.href,
});

Browser.runtime.onMessage.addListener((message, sender) => {
  try {
    if (message?.type === "DOMAIN_STATUS" && message?.status === "blocked") {
      injectWarningBanner(message.reason || "DefiLlama blocklist warning");
    }
  } catch (error) {}
});

if (EXPLORER_CHAIN_PREFIX_MAP[hostname]) {
  genericEtherscanComponent();
} else {
  switch (hostname) {
    case "twitter.com":
    case "x.com":
      initPhishingDetector();
      break;
    default:
      break;
  }
}

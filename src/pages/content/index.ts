import Browser from "webextension-polyfill";
import * as psl from "psl";
import { EXPLORER_CHAIN_PREFIX_MAP } from "../libs/constants";
import genericEtherscanComponent from "./components/explorers/genericEtherscanComponent"
import initPhishingDetector from "./components/twitter/init"
import { injectWarningBanner } from "./components/WarningBanner"

const hostname = new URL(document.baseURI).hostname;
const parsed = psl.parse(hostname);
const host = (parsed && 'domain' in parsed && parsed.domain) || hostname;


Browser.runtime.sendMessage({
  type: "CHECK_CURRENT_DOMAIN",
  hostname: hostname,
  url: window.location.href
}).catch(() => { });


Browser.runtime.onMessage.addListener((message) => {
  if (message.type === "DOMAIN_STATUS" && message.status === "blocked") {
    injectWarningBanner(message.reason);
  }
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
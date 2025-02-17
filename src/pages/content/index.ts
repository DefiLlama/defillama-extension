import { EXPLORER_CHAIN_PREFIX_MAP } from "../libs/constants";
import genericEtherscanComponent from "./components/explorers/genericEtherscanComponent"
import initPhishingDetector from  "./components/twitter/init"

const host = new URL(document.baseURI).hostname;

if (EXPLORER_CHAIN_PREFIX_MAP[host]) {
  genericEtherscanComponent();
} else {
  switch (host) {
    case "twitter.com":
    case "x.com":
      initPhishingDetector();
      break;
    default:
      break;
  }
}
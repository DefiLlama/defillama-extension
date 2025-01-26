import { BlockscoutAlikeExplorerConfig, injectPrice } from "../blockscoutInjectPrice";

export default function injectExplorerComponent() {
  let name = new URL(document.baseURI).hostname;
  let chainPrefix: string;

  switch (name) {
    case "eth.blockscout.com": chainPrefix = "ethereum:"; break;
    case "optimism.blockscout.com": chainPrefix = "optimism:"; break;
    default: return;
  }

  const config: BlockscoutAlikeExplorerConfig = {
    name,
    chainPrefix,
  };

  injectPrice(config);
}

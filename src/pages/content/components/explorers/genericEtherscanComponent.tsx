import { EXPLORER_CHAIN_PREFIX_MAP } from "@src/pages/libs/constants";
import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjectPrice";
import { injectTags } from "../etherscanInjectTags";

export default function injectExplorerComponent() {
  let name = new URL(document.baseURI).hostname;
  let prefix = EXPLORER_CHAIN_PREFIX_MAP[name];
  if (!prefix) return;

  const config: EtherscanAlikeExplorerConfig = {
    name,
    chainPrefix: prefix + ':',
  };

  injectPrice(config);
  injectTags();
}

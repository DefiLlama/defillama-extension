import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjector";

const config: EtherscanAlikeExplorerConfig = {
  name: "OptimismScan",
  indexTotalAmountTextSplit: 1,
  selectorTokenList: "li.list-custom.list-custom-ERC20 > a",
  chainPrefix: "optimism:",
};

injectPrice(config);

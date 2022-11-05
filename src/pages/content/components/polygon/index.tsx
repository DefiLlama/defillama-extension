import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjectPrice";

const config: EtherscanAlikeExplorerConfig = {
  name: "PolygonScan",
  indexTotalAmountTextSplit: 1,
  selectorTokenList: "li.list-custom.list-custom-ERC-20 > a",
  chainPrefix: "polygon:",
};

injectPrice(config);

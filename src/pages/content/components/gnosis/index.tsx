import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjectPrice";

const config: EtherscanAlikeExplorerConfig = {
  name: "GnosisScan",
  indexTotalAmountTextSplit: 2,
  selectorTokenList: "li.list-custom.list-custom-ERC-20 > a",
  chainPrefix: "xdai:",
};

injectPrice(config);

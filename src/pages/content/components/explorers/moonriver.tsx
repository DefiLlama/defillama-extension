import { EtherscanAlikeExplorerConfig, injectPrice } from "../etherscanInjectPrice";
import { injectTags } from "../etherscanInjectTags";

const config: EtherscanAlikeExplorerConfig = {
  name: "Moonriver Moonscan",
  indexTotalAmountTextSplit: 2,
  selectorTokenList: "li.list-custom.list-custom-ERC-20 > a",
  chainPrefix: "moonriver:",
};

injectPrice(config);
injectTags();

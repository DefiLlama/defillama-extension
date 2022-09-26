type SelectorPurposes = "remove" | "appendTo" | "insertInto";

export interface EtherscanAlikeSelectors {
  [route: string]: {
    [purpose in SelectorPurposes]?: string;
  };
}

export const ETHEREUM_SELECTORS: EtherscanAlikeSelectors = {
  address: {
    appendTo: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a",
    remove: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span", // span.text-secondary
  },
} as const;

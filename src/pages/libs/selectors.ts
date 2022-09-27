type SelectorPurposes = "remove" | "appendTo" | "insertInto" | "select" | "test";

export interface EtherscanAlikeSelectors {
  address?: {
    erc20?: {
      [purpose in SelectorPurposes]?: string;
    };
    tokenList?: {
      [purpose in SelectorPurposes]?: string;
    };
  };
  token?: {};
  tx?: {};
}

export const ETHEREUM_SELECTORS: EtherscanAlikeSelectors = {
  address: {
    erc20: {
      test: "#ContentPlaceHolder1_tr_tokeninfo",
      appendTo: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a",
      select: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span", // span.text-secondary
      // remove: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span", // span.text-secondary
    },
    tokenList: {
      select: "li.list-custom.list-custom-ERC20 > a",
    },
  },
} as const;

export const AVAX_SELECTORS: EtherscanAlikeSelectors = {
  address: {
    erc20: {
      test: "#ContentPlaceHolder1_tr_tokeninfo",
      appendTo: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > a",
      select: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span", // span.text-secondary
      // remove: "#ContentPlaceHolder1_tr_tokeninfo > div > div.col-md-8 > span", // span.text-secondary
    },
    tokenList: {
      select: "li.list-custom.list-custom-ERC-20 > a",
    },
  },
} as const;

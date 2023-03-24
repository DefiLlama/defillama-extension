export const PRICES_API = "https://coins.llama.fi/prices/current";
export interface Prices {
  coins: {
    [key: string]: {
      price: number;
      symbol: string;
      timestamp: number;
      confidence: number;
    };
  };
}

export const PROTOCOLS_API = "https://api.llama.fi/lite/protocols2";
export const PROTOCOL_TVL_THRESHOLD = 5000000;

export const ACCOUNTS_API_V2 = "https://accounts.llama.fi/api/v2/address";
export type TagsDataV2 = { [address: string]: DisplayTag[] };
export interface DisplayTag {
  text?: string;
  icon?: string;
  link?: string;
  tooltip?: string;
  bg?:
    | "bg-primary"
    | "bg-secondary"
    | "bg-success"
    | "bg-danger"
    | "bg-warning"
    | "bg-info"
    | "bg-light"
    | "bg-dark"
    | "bg-white";
  textColor?:
    | "text-primary"
    | "text-secondary"
    | "text-success"
    | "text-danger"
    | "text-warning"
    | "text-info"
    | "text-light"
    | "text-dark"
    | "text-muted"
    | "text-white";
}

export const METAMASK_LIST_CONFIG_API =
  "https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/master/src/config.json";
export const DEFILLAMA_DIRECTORY_API = "https://raw.githubusercontent.com/DefiLlama/url-directory/master/domains.json";

export const CHAIN_PREFIX = {
  ETHEREUM: "ethereum",
  BSC: "bsc",
  AVAX: "avax",
  FANTOM: "fantom",
  ARBITRUM: "arbitrum",
  POLYGON: "polygon",
  OPTIMISM: "optimism",
  CRONOS: "cronos",
  MOONRIVER: "moonriver",
  MOONBEAM: "moonbeam",
  GNOSIS: "xdai",
  BOBA: "boba",
} as const;

export const EXPLORER_CHAIN_PREFIX_MAP: { [domain: string]: string } = {
  "etherscan.io": CHAIN_PREFIX.ETHEREUM,
  "bscscan.com": CHAIN_PREFIX.BSC,
  "snowtrace.io": CHAIN_PREFIX.AVAX,
  "ftmscan.com": CHAIN_PREFIX.FANTOM,
  "arbiscan.io": CHAIN_PREFIX.ARBITRUM,
  "polygonscan.com": CHAIN_PREFIX.POLYGON,
  "optimistic.etherscan.io": CHAIN_PREFIX.OPTIMISM,
  "cronoscan.com": CHAIN_PREFIX.CRONOS,
  "moonriver.moonscan.io": CHAIN_PREFIX.MOONRIVER,
  "moonscan.io": CHAIN_PREFIX.MOONBEAM,
  "gnosisscan.io": CHAIN_PREFIX.GNOSIS,
  "bobascan.com": CHAIN_PREFIX.BOBA,
} as const;

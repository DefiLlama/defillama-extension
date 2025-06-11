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
export const TWITTER_CONFIG_API = "https://defillama-datasets.llama.fi/extension/twitter-config.json";
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


export const EXPLORER_CHAIN_PREFIX_MAP: { [domain: string]: string } = {
  "etherscan.io": "ethereum",
  "bscscan.com": "bsc",
  "snowscan.xyz": "avax",
  "ftmscan.com": "fantom",
  "arbiscan.io": "arbitrum",
  "polygonscan.com": "polygon",
  "optimistic.etherscan.io": "optimism",
  "cronoscan.com": "cronos",
  "moonriver.moonscan.io": "moonriver",
  "moonbeam.moonscan.io": "moonbeam",
  "moonscan.io": "moonbeam",
  "gnosisscan.io": "xdai",
  "bobascan.com": "boba",
  "zkevm.polygonscan.com": "polygon_zkevm",
  "nova.arbiscan.io": "arbitrum_nova",
  "celoscan.com": "celo",
  "bttcscan.com": "bittorrent",
  "scrollscan.com": "scroll",
  "lineascan.build": "linea",
  "basescan.org": "base",
  "era.zksync.network": "era",
  "kromascan.com": "kroma",
  "berascan.com": "berachain",
}
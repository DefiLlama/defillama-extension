import llub from "@src/assets/img/memes/llub-128.png";
import smort from "@src/assets/img/memes/smort-128.png";
import institute from "@src/assets/img/memes/institute-128.png";
import opensea from "@src/assets/img/protocols/opensea.png";
import uniswap from "@src/assets/img/protocols/uniswap.png";
import { TagsDataV1 } from "./constants";

export interface DisplayTag {
  name: string;
  color?: string;
  description?: string;
  icon?: string;
  link?: (input: string) => string;
}

const TAG_TYPES = {
  OPENSEA: {
    icon: opensea,
    link: (input: string) => `https://opensea.io/${input}`,
  },
  // UNISWAP: {
  //   icon: uniswap,
  // },
} as const;

export const makeDisplayTags = (rawTags: string[]) => {
  // sort the rawTags with the following order:
  // 1. "OpenSea User" tag
  // 2. Contract Deployer
  // 3. Gitcoin Donor
  // 4. Tornado.Cash Depositor
  // 5. Tornado.Cash Withdrawer
  // 6. Blur User
  // 7. other tags starting with "Funded By: "
  const _rawTags = [...rawTags].sort((a, b) => {
    if (a === "OpenSea User") return -1;
    if (b === "OpenSea User") return 1;
    if (a === "Contract Deployer") return -1;
    if (b === "Contract Deployer") return 1;
    if (a === "Gitcoin Donor") return -1;
    if (b === "Gitcoin Donor") return 1;
    if (a === "Tornado.Cash Depositor") return -1;
    if (b === "Tornado.Cash Depositor") return 1;
    if (a === "Tornado.Cash Withdrawer") return -1;
    if (b === "Tornado.Cash Withdrawer") return 1;
    if (a === "Blur User") return -1;
    if (b === "Blur User") return 1;
    if (a.startsWith("Funded By: ")) return -1;
    if (b.startsWith("Funded By: ")) return 1;
    return 0;
  });

  const tags: DisplayTag[] = [];

  if (_rawTags.includes("OpenSea User")) {
    // if doesn't have another tag starting with "OpenSea:", add "OpenSea User" tag.
    // otherwise, add the tag starting with "OpenSea:" tag.
    const openSeaTag = _rawTags.find((tag) => tag.startsWith("OpenSea: "));
    if (openSeaTag) {
      tags.push({
        name: openSeaTag.replace("OpenSea: ", ""),
        description: "OpenSea User",
        ...TAG_TYPES.OPENSEA,
      });
    } else {
      tags.push({
        name: "OpenSea User",
        ...TAG_TYPES.OPENSEA,
      });
    }
  }

  for (const rawTag of _rawTags) {
    if (rawTag.startsWith("OpenSea: ") || rawTag === "OpenSea User") {
      continue;
    }
    tags.push({
      name: rawTag,
    });
  }

  return tags;
};

export interface DisplayTagV1 {
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

export const makeDisplayTagsV1 = (tagsDataDict: TagsDataV1, account: string) => {
  const displayTags: DisplayTagV1[] = [];
  const tagsData = tagsDataDict[account];

  const fundedByCex = tagsData.behaviorals.filter((tag) => tag.category === "Funded By CEX");
};

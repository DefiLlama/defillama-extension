import llub from "@src/assets/img/memes/llub-128.png";
import smort from "@src/assets/img/memes/smort-128.png";
import institute from "@src/assets/img/memes/institute-128.png";
import opensea from "@src/assets/img/protocols/opensea.png";
import uniswap from "@src/assets/img/protocols/uniswap.png";
import shibaswap from "@src/assets/img/protocols/shibaswap.webp";
import sushi from "@src/assets/img/protocols/sushi.webp";
import balancer from "@src/assets/img/protocols/balancer.webp";
import pcs from "@src/assets/img/protocols/pcs.webp";
import fraxswap from "@src/assets/img/protocols/fraxswap.webp";
import { TagsDataV1Core } from "./constants";

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

export const makeDisplayTagsV1 = (tagsData: TagsDataV1Core) => {
  const socials: DisplayTagV1[] = tagsData.socials.map((data) => ({
    text: data.name,
    icon: data.protocol === "Opensea" ? opensea : null,
    link: data.protocol === "Opensea" ? `https://opensea.io/${data.name}` : null,
    bg: "bg-primary",
    textColor: "text-light",
  }));

  const entities: DisplayTagV1[] = tagsData.entities.map((data) => ({
    text: data.tag,
    icon: institute,
    bg: "bg-dark",
    textColor: "text-white",
  }));

  const fundedByCex: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "Funded By CEX")
    .map((data) => ({
      text: data.tag,
      bg: "bg-warning",
      textColor: "text-dark",
    }));

  const advancedDexUsers: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "Advanced DEX User")
    .map((data) => ({
      text: data.tag,
      bg: "bg-success",
      textColor: "text-white",
      icon: smort,
      info: data.tag === "Frequent Dex Trader" ? "Top 1% frequent traders" : null,
    }));

  const smartMoney: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "Smart Money")
    .map((data) => ({
      text: data.tag,
      bg: "bg-danger",
      textColor: "text-white",
      icon: smort,
      info:
        data.tag === "Early LP"
          ? "Top 100 addresses which have consistently provided the earliest liquidity on all known DEXs"
          : data.tag === "Early Farmer"
          ? "Top 100 addresses which have consistently deposited the earliest into stake pools"
          : null,
    }));

  const nftCollectors: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "NFT Collector")
    .map((data) => ({
      text: data.tag,
      bg: "bg-danger",
      textColor: "text-white",
      icon: smort,
      info:
        data.tag === "NFT Enjoyoor"
          ? "Top 1m addresses which have sent or received NFTs"
          : data.tag === "Uncommon NFT Enjoyoor"
          ? "Top 100k addresses which have sent or received NFTs"
          : data.tag === "Rare NFT Enjoyoor"
          ? "Top 25k addresses which have sent or received NFTs"
          : data.tag === "Epic NFT Enjoyoor"
          ? "Top 10k addresses which have sent or received NFTs"
          : data.tag === "Legendary NFT Enjoyoor"
          ? "Top 1k addresses which have sent or received NFTs"
          : null,
    }));

  const donors: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "Donation")
    .map((data) => ({
      text: data.tag,
      bg: "bg-primary",
      textColor: "text-white",
      icon: llub,
    }));

  const dexUsers: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "DEX User")
    .map((data) => ({
      icon:
        data.tag === "UniswapV2" || data.tag === "UniswapV3"
          ? uniswap
          : data.tag === "Balancer"
          ? balancer
          : data.tag === "Fraxswap"
          ? fraxswap
          : data.tag === "PancakeSwap ETH"
          ? pcs
          : data.tag === "ShibaSwap"
          ? shibaswap
          : data.tag === "SushiSwap"
          ? sushi
          : null,
      info: data.tag,
    }));

  const otherBehaviorals: DisplayTagV1[] = tagsData.behaviorals
    .filter(
      (data) =>
        data.category === "NFT Marketplace User" ||
        data.category === "NFT Minter" ||
        data.category === "Airdrop Recipients" ||
        data.category === "Early Investor" ||
        data.category === "Privacy Protocol User" ||
        data.category === "Rug Victim" ||
        data.category === "Developer" ||
        data.category === "DeFi" ||
        data.category === "Memes" ||
        data.category === "Misc",
    )
    .map((data) => ({
      text: data.tag,
      bg: "bg-secondary",
      textColor: "text-light",
    }));

  return [
    ...socials,
    ...entities,
    ...fundedByCex,
    ...advancedDexUsers,
    ...smartMoney,
    ...nftCollectors,
    ...donors,
    ...dexUsers,
    ...otherBehaviorals,
  ];
};

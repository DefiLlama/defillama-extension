import llub from "@src/assets/img/memes/llub-128.png";
import smort from "@src/assets/img/memes/smort-128.png";
import institute from "@src/assets/img/memes/institute-128.png";
import opensea from "@src/assets/img/protocols/opensea.png";
import uniswap from "@src/assets/img/protocols/uniswap.png";
import uniswapv3 from "@src/assets/img/protocols/uniswapv3.webp";
import shibaswap from "@src/assets/img/protocols/shibaswap.webp";
import sushi from "@src/assets/img/protocols/sushi.webp";
import balancer from "@src/assets/img/protocols/balancer.webp";
import pcs from "@src/assets/img/protocols/pcs.webp";
import fraxswap from "@src/assets/img/protocols/fraxswap.webp";
import { TagsDataV1Core } from "./constants";

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

export const makeDisplayTagsV1 = (account: string, tagsData: TagsDataV1Core) => {
  const socials: DisplayTagV1[] = tagsData.socials.map((data) => ({
    text: data.name,
    icon: data.protocol === "Opensea" ? opensea : null,
    link: data.protocol === "Opensea" ? `https://opensea.io/${account}` : null,
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
      tooltip: "Funded by CEX",
    }));

  const advancedDexUsers: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "Advanced DEX User")
    .map((data) => ({
      text: data.tag,
      bg: "bg-success",
      textColor: "text-white",
      icon: smort,
      tooltip: data.tag === "Frequent Dex Trader" ? "Top 1% frequent traders" : null,
    }));

  const smartMoney: DisplayTagV1[] = tagsData.behaviorals
    .filter((data) => data.category === "Smart Money")
    .map((data) => ({
      text: data.tag,
      bg: "bg-danger",
      textColor: "text-white",
      icon: smort,
      tooltip:
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
      tooltip:
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
        data.tag === "UniswapV2"
          ? uniswap
          : data.tag === "UniswapV3"
          ? uniswapv3
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
      tooltip: data.tag + " User",
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

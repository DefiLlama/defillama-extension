import { TagsData } from "./constants";
import llub from "@src/assets/img/memes/llub-128.png";
import smort from "@src/assets/img/memes/smort-128.png";
import institute from "@src/assets/img/memes/institute-128.png";
import opensea from "@src/assets/img/protocols/opensea.png";
import uniswap from "@src/assets/img/protocols/uniswap.png";

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

export const makeDisplayTags = (res: TagsData) => {
  const tags: DisplayTag[] = [];
  const rawTags = res.tags;

  if (rawTags.includes("OpenSea User")) {
    // if doesn't have another tag starting with "OpenSea:", add "OpenSea User" tag.
    // otherwise, add the tag starting with "OpenSea:" tag.
    const openSeaTag = rawTags.find((tag) => tag.startsWith("OpenSea: "));
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

  for (const rawTag of rawTags) {
    if (rawTag.startsWith("OpenSea: ") || rawTag === "OpenSea User") {
      continue;
    }
    tags.push({
      name: rawTag,
    });
  }

  return tags;
};

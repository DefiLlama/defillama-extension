import llub from "@src/assets/img/memes/llub-128.png";
import smort from "@src/assets/img/memes/smort-128.png";
import institute from "@src/assets/img/memes/institute-128.png";
import { TagsData } from "./constants";

export interface DisplayTag {
  name: string;
  color?: string;
  description?: string;
  icon?: string;
  link?: string;
}

const makeDisplayTags = (res: TagsData) => {
  const tags: DisplayTag[] = [];
  const rawTags = res.tags;
  for (const rawTag of rawTags) {
  }
};

const TAG_TYPES = {
  OPENSEA: {
    icon: "opensea",
    link: (input: string) => `https://opensea.io/${input}`,
  },
  UNISWAP: {
    icon: "uniswap",
  },
} as const;

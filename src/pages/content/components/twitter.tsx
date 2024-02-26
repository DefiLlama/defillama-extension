import { getStorage } from "@src/pages/libs/helpers";
import levenshtein from "fast-levenshtein";
import { DEFAULT_SETTINGS } from "@src/pages/libs/constants";

initPhishingHandleDetector();
const debouncedVerifyHandle = debounce(verifyHandle, 200);
const debouncedVerifyHandle2 = debounce(verifyHandle, 2000); // maybe tweets take some time to load if you scroll too fast
const debouncedVerifyHandle3 = debounce(verifyHandle, 5000); // maybe tweets take some time to load if you scroll too fast

async function initPhishingHandleDetector() {
  const phishingHandleDetector = await getStorage(
    "local",
    "settings:phishingHandleDetector",
    DEFAULT_SETTINGS.PHISHING_HANDLE_DETECTOR,
  );
  if (!phishingHandleDetector) return;

  verifyHandle();
  window.addEventListener("scroll", () => {
    debouncedVerifyHandle();
    debouncedVerifyHandle2();
    debouncedVerifyHandle3();
  });
}

const susHandles = new Set() as Set<string>;
let lastSafeDisplayName: string;

async function verifyHandle() {
  const twitterConfig = await getStorage("local", "twitterConfig", { whitelist: [], blacklist: [] } as any);
  twitterConfig.whitelistSet = new Set(twitterConfig.whitelist || []);
  twitterConfig.blacklistSet = new Set(twitterConfig.blacklist || []);

  const isTweetPage = window.location.pathname.split("/")[2] === "status";
  if (!isTweetPage) return handleHomePage(twitterConfig);

  const safeHandle = window.location.pathname.split("/")[1];
  let safeDisplayName = lastSafeDisplayName;
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  for (const tweet of tweets) {
    const { tweetHandle, displayName } = getTweetInfo(tweet);

    if (susHandles.has(tweetHandle) || twitterConfig.blacklistSet.has(tweetHandle))
      // if handle is already in the blacklist, notify user of sus tweet
      handleSusTweets(tweet, tweetHandle);
    else if (tweetHandle === safeHandle) {
      // if handle is the same as the current page handle, extract the display name as whitelisted username
      lastSafeDisplayName = displayName;
      safeDisplayName = displayName;
    } else if (twitterConfig.whitelistSet.has(tweetHandle))
      // if handle is in the whitelist, ignore
      continue;
    else if (safeDisplayName && areHandlesSimilar(safeDisplayName, displayName, 3))
      // if display name is similar to the current main tweet's display name, treat as sus tweet
      handleSusTweets(tweet, tweetHandle);
    else if (
      areHandlesSimilar(safeHandle, tweetHandle) ||
      twitterConfig.whitelist.some((i) => areHandlesSimilar(i, tweetHandle, 3))
    )
      // if handle is similar to the current page handle or any of the whitelisted handles, treat as sus tweet
      handleSusTweets(tweet, tweetHandle);
  }

  function handleSusTweets(tweet: any, handle: string) {
    susHandles.add(handle);
    (tweet as any).style.background = "#c0000069"; // set background as light red
  }
}

async function handleHomePage(twitterConfig) {
  return; // disable for now
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  for (const tweet of tweets) {
    const { comments, likes, retweets, tweetHandle } = getTweetInfo(tweet);
    // if (comments === 0 && (likes > 10 || retweets > 5)) handleSusTweets(tweet);
    if (twitterConfig.blacklistSet.has(tweetHandle)) handleSusTweets(tweet);
    else if (twitterConfig.whitelistSet.has(tweetHandle)) continue;
    else if (twitterConfig.whitelist.some((i) => areHandlesSimilar(i, tweetHandle, 3))) handleSusTweets(tweet);
  }

  function handleSusTweets(tweet: any) {
    (tweet as any).style.background = "#ff000069"; // set background as light red
  }
}

function getTweetInfo(tweet: any) {
  const getNumber = (id: string) => {
    const element = tweet.querySelector(`[data-testid="${id}"]`);
    if (!element) return 0;
    return +element.getAttribute("aria-label").split(" ")[0];
  };
  let element = tweet.querySelectorAll('a[role="link"]');
  if (element[0].innerText.endsWith("retweeted") || element[0].innerText.endsWith("reposted"))
    element = Array.from(element).slice(1);
  return {
    tweetHandle: (element[2] as any).innerText.replace("@", ""),
    displayName: (element[1] as any).innerText,
    comments: getNumber("reply"),
    likes: getNumber("like"),
    retweets: getNumber("retweet"),
  };
}

function areHandlesSimilar(handle1, handle2, threshold = 4) {
  handle1 = handle1.toLowerCase();
  handle2 = handle2.toLowerCase();
  // if (handle1.length > handle2.length) handle1 = handle1.slice(0, handle2.length);
  // if (handle2.length > handle1.length) handle2 = handle2.slice(0, handle1.length);

  if (handle1 === handle2) return true;
  const distance = levenshtein.get(handle1, handle2);
  return distance <= threshold; // or whatever threshold you consider as "similar"
}

const debounceTimers = {} as any;

function debounce(func, delay) {
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimers[delay]);
    debounceTimers[delay] = setTimeout(() => func.apply(context, args), delay);
  };
}

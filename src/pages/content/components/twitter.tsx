import { getStorage } from "@src/pages/libs/helpers";
import levenshtein from "fast-levenshtein";

initPhishingHandleDetector();
const debouncedVerifyHandle = debounce(verifyHandle, 200);
const debouncedVerifyHandle2 = debounce(verifyHandle, 2000); // maybe tweets take some time to load if you scroll too fast
const debouncedVerifyHandle3 = debounce(verifyHandle, 5000); // maybe tweets take some time to load if you scroll too fast

async function initPhishingHandleDetector() {
  const phishingHandleDetector = await getStorage("local", "settings:phishingHandleDetector", true);
  if (!phishingHandleDetector) return;

  verifyHandle();
  window.addEventListener("scroll", () => {
    debouncedVerifyHandle();
    debouncedVerifyHandle2();
    debouncedVerifyHandle3();
  });
}

const handleToName = {}
async function verifyHandle() {
  const isTweetPage = window.location.pathname.split("/")[2] === "status";
  if (!isTweetPage) return

  const safeHandle = window.location.pathname.split("/")[1].toLowerCase();
  const tweets = document.querySelectorAll('[data-testid="tweet"]');
  
  tweets.forEach((tweet, index) => {
    const { tweetHandle, displayName, tweetText, isRepliedTo } = getTweetInfo(tweet);
    if (/^[0-9]+$/.test(tweetText)) {
      return handleSusTweet(tweet);
    }
    if (tweetHandle.toLowerCase() === safeHandle) {
      handleToName[safeHandle] = displayName.toLowerCase();
      return;
    }
    if (handleToName[safeHandle]) {
      const distance = levenshtein.get(handleToName[safeHandle], displayName.toLowerCase());
      if (distance <= 1) {
        if(index === 0 && isRepliedTo){
          tweets.forEach((tweet2) => {
            if(getTweetInfo(tweet2).tweetHandle.toLowerCase() == safeHandle){
              handleSusTweet(tweet2);
            }
          })
        } else {
          handleSusTweet(tweet);
        }
        return;
      }
    }
  });

  function handleSusTweet(tweet: any) {
    (tweet as any).style.background = "#c0000069"; // set background as light red
  }
}

async function handleHomePage(twitterConfig) {
  return; // disable for now
  /*
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
  */
}

function getTweetInfo(tweet: any) {
  const getNumber = (id: string) => {
    const element = tweet.querySelector(`[data-testid="${id}"]`);
    if (!element) return 0;
    return +element.getAttribute("aria-label").split(" ")[0];
  };
  let element = tweet.querySelectorAll('a[role="link"]')
  if (element[0].innerText.endsWith("retweeted") || element[0].innerText.endsWith("reposted")) element = Array.from(element).slice(1);
  const tweetText = tweet.querySelectorAll('[data-testid="tweetText"]')[0].innerText
  const isRepliedTo = tweet.querySelector('[data-testid="Tweet-User-Avatar"]')?.parentElement?.children?.length > 1
  return {
    tweetHandle: (element[2] as any).innerText.replace("@", ""),
    displayName: (element[1] as any).innerText,
    tweetText,
    isRepliedTo
  };
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

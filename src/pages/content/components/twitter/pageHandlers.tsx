import {
  getTweetInfo, handleAdTweet, handleOpTweet, handleSusTweet, handleTweetWithAddress, handleCashTag, handleHashTag, handleQT, handleSpamQT,
  handleBotReplies,
} from "./tweetHandlers";
import levenshtein from "fast-levenshtein";

/**
 * In-memory cache for holding previously analyzed links to prevent redundant analysis and reduce time to render ui modifications.
 * Also used to handle edge case of navigating back to a url that has been scrolled down (far enough down that actual original post is unmounted / not loaded yet).
 * Only storing the tweet handle and display name since they are only needed post-initial analysis actions (and to prevent memory bloat). Cleared/reset on refresh.
 */
export const tweetSafeInfoMemoryCache: {
  [pathname: string]: {
    tweetHandle: string;
    displayName: string;
  };
} = {};

/**
 * On demand initial analysis for the tweet status page.
 * Used to determine if the current linked tweet is a reply or the original post (the linked tweet cannot be assumed to be safe)
 */
export const tweetStatusPageInitialAnalysis = {
  linkedTweet: null as HTMLElement | null,
  batchNumberCounter: 0 as 0 | 1,
  isSafeTweetDetermined: false,
};

type TwitterConfig = {
  twitterCashTags: boolean;
  twitterHashTags: boolean;
  twitterQT: boolean;
  twitterBotReplies: boolean;
  twitterAddresses: boolean;
};

/**
 * Analyze tweets (op and replies) on the linked status page
 */
export async function handleTweetStatusPage({ twitterCashTags, twitterHashTags, twitterQT, twitterBotReplies, twitterAddresses, }: TwitterConfig) {
  const pathname = window.location.pathname;

  // check that the current page is a tweet page (not home/timeline page). Check done here in addition to in init page handler router to catch any edge cases
  const isTweetPage = pathname.split("/")[2] === "status";
  if (!isTweetPage) return;

  // get all tweets present. Redundancy in querying all tweets in each batch to mitigate edge cases and to preemptively assess tweets when they are loaded but before they are visible in the viewport (smoother ux)
  let tweetConversation = document.querySelector<HTMLElement>('[aria-label="Timeline: Conversation"]');

  // Fallback: try other common aria-labels (localized versions)
  if (!tweetConversation) {
      document.querySelector<HTMLElement>('[aria-label="Timeline: Conversa"]') || // Portuguese
      document.querySelector<HTMLElement>('[aria-label="Timeline: Conversación"]') || // Spanish
      document.querySelector<HTMLElement>('[aria-label="Timeline: 会話"]') // Japanese
      // Add more localized versions as needed...
  }

  // If still not found, just search the entire document for tweets
  let tweets: HTMLElement[];
  if (!tweetConversation) {
    tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));
  } else {
    tweets = Array.from(tweetConversation.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));
  }

  // add QT inside the tweet body (if it exists)
  tweets.forEach((tweet) => {
    const probableTweets = [...tweet.querySelectorAll<HTMLElement>('[tabindex="0"]')].filter((el) => {
      // check if it has a tweet handle
      return el.querySelector('[data-testid="User-Name"]')
    })
    tweets.push(...probableTweets)
  })
  // dont analyze batches of zero tweets. covers outcomes in which the page is still loading or when there are no other posts/replies (no need for further analysis)
  if (!tweets.length) return;

  // if safe tweet previously found and saved to cache, then skip analysis
  if (tweetSafeInfoMemoryCache[pathname]) {
    tweetStatusPageInitialAnalysis.isSafeTweetDetermined = true;
  }

  // analyze the tweet batch
  tweets.forEach((tweet, index) => {
    /*
      Initial analysis: determine safe tweet if cache entry for current url not present
      - first batch will always include the linked tweet (first tweet in batch length of 1)
      - second batch will include the linked tweet and any surrounding tweets (either replies or the original post) (first tweet in batch length of > 1)
      - if no second batch (no surrounding tweets) then linked tweet is the original post and has no replies, thus does not need to be analyzed
    */
    if (!tweetStatusPageInitialAnalysis.isSafeTweetDetermined) {
      // save the first tweet in the first batch as the linked tweet (always the first tweet that is loaded on a status page)
      if (tweetStatusPageInitialAnalysis.batchNumberCounter === 0 && index == 0) {
        tweetStatusPageInitialAnalysis.linkedTweet = tweet;
        tweetStatusPageInitialAnalysis.batchNumberCounter++;
        return;
      }

      // compare the first tweet of the second batch to the linked tweet to determine if it is a reply or the original post
      if (tweetStatusPageInitialAnalysis.batchNumberCounter === 1 && index == 0) {
        // [dont need to do tweet.isEqualNode(tweetStatusPageInitialAnalysis.linkedTweet) here, can just use this first tweet of second batch]

        // save safe tweet info
        const { tweetHandle, displayName } = getTweetInfo(tweet);
        tweetSafeInfoMemoryCache[pathname] = { tweetHandle, displayName };
        tweetStatusPageInitialAnalysis.isSafeTweetDetermined = true;
      }
    }

    // once safe tweet is determined, then can proceed to do analysis and ui modifications
    if (!tweetSafeInfoMemoryCache[pathname]) return;
    let { tweetHandle: safeHandle, displayName: safeName } = tweetSafeInfoMemoryCache[pathname]
    safeHandle = safeHandle.toLowerCase();
    safeName = safeName.toLowerCase();
    // check if the tweet has already been analyzed
    if (tweet.getAttribute("data-dl-tweet-check")) return;

    let { tweetHandle, displayName, tweetText, isRepliedTo, isLinkedTweet } = getTweetInfo(tweet);
    tweetHandle = tweetHandle.toLowerCase();
    displayName = displayName.toLowerCase();

    // if the tweet handle is safe, then it's not a phishing handle (add to safe handle list)
    if (tweetHandle === safeHandle) {
      handleOpTweet(tweet);
      return;
    } else {
      handleAdTweet(tweet);

      /*    spammers stopped this method, so disabled for now

      // if the tweet text content consists of only numbers, then it's sus. Add red background the tweet
      const onlyNumbers = tweetText.length > 1 && /^[0-9]+$/.test(tweetText) // exception make for '4' tweet
      // it is not number but probably gibberish word
      const gibberish = !onlyNumbers && tweetText.split(" ").length === 1 && /[0-9]/.test(tweetText) && /[a-z]/.test(tweetText) && /[A-Z]/.test(tweetText) && /^[a-zA-Z0-9]+$/.test(tweetText)
      if (onlyNumbers || gibberish) {
        handleSusTweet(tweet, isLinkedTweet, "onlyNumbers", "BG_RED");
        return;
      }
 */
      // only hide addresses if not from the op (OP tweets return early above, so this is safe)
      if (twitterAddresses && tweetText) handleTweetWithAddress(tweet, tweetText, isLinkedTweet);
      if (twitterCashTags && tweetText) handleCashTag(tweet, tweetText, isLinkedTweet);
      if (twitterHashTags && tweetText) handleHashTag(tweet, tweetText, isLinkedTweet);
      if (twitterQT && tweetText) handleQT(tweet, tweetText, isLinkedTweet);
      if (twitterBotReplies && tweetText) handleBotReplies(tweet, tweetText, isLinkedTweet);
      else {
        // handleSpamQT(tweet, isLinkedTweet);   // disabled for now, since it is not working properly
      }
    }

    const handleDistance = levenshtein.get(safeHandle, tweetHandle);
    let nameDistance = levenshtein.get(safeName, displayName);

    if (safeName.length < 4 || displayName.length < 4)
      nameDistance = 10; // if either of the name is too short, then ignore this check

    // if the tweet handle is the same as the page handle, then it's sus. Add red background the tweet
    // [can improve due to false negatives with homoglyphic attacks in the username that cant be detected by equality. maybe use levenshtein distance fuzzy matching on username as well]
    if (handleDistance <= 1 || nameDistance <= 1) {
      if (index === 0 && isRepliedTo) {
        tweets.forEach((tweet2) => {
          const { tweetHandle: tweet2Handle } = getTweetInfo(tweet2);
          // Flag tweets that match the IMPERSONATOR's handle, not the safe handle
          if (tweet2Handle.toLowerCase() === tweetHandle.toLowerCase()) {
            handleSusTweet(tweet2, getTweetInfo(tweet2).isLinkedTweet, "impersonation", "BG_RED");
          }
        });
      } else {
        handleSusTweet(tweet, isLinkedTweet, "impersonation", "BG_RED");
      }

      return;
    }

    // denote that the tweet has been checked, preventing duplicate analysis
    tweet.setAttribute("data-dl-tweet-check", "true");
  });
}

//

/**
 * Analyze tweets found on the linked user timeline page
 */
export async function handleUserTimelinePage(_twitterConfig: TwitterConfig) {
  const isUserTimelinePage = !!document.querySelectorAll<HTMLElement>('[data-testid="UserName"]').length;
  if (!isUserTimelinePage) return;

  const tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));

  tweets.forEach((tweet, index) => {
    handleAdTweet(tweet);
  });
}

/**
 * Analyze tweets found on the home page
 */
export async function handleHomePage(_twitterConfig: TwitterConfig) {
  const isHomePage = window.location.pathname === "/home";
  if (!isHomePage) return;

  const tweets = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="tweet"]'));

  tweets.forEach((tweet, index) => {
    handleAdTweet(tweet);
  });
}

import { getStorage, } from "@src/pages/libs/helpers";

initPhishingHandleDetector();
const debouncedVerifyHandle = debounce(verifyHandle, 200, );
const debouncedVerifyHandle2 = debounce(verifyHandle, 5000); // maybe tweets take some time to load if you scroll too fast


async function initPhishingHandleDetector() {
  const phishingHandleDetector = await getStorage("local", "settings:phishingHandleDetector", true);
  if (!phishingHandleDetector) return;

  verifyHandle();
  window.addEventListener('scroll', () => {
    debouncedVerifyHandle();
    debouncedVerifyHandle2();
  });
}

const susHandles = new Set() as Set<string>;

async function verifyHandle() {
  const isTweetPage = window.location.pathname.split("/")[2] === "status"
  if (!isTweetPage) return;

  const safeHandle = window.location.pathname.split("/")[1]
  let safeDisplayName
  const tweets = document.querySelectorAll('[data-testid="tweet"]')
  for (const tweet of tweets) {
    const element = tweet.querySelectorAll('a[role="link"]')
    const tweetHandle = (element[2] as any).innerText.replace('@', '')
    const displayName = (element[1] as any).innerText

    if (susHandles.has(tweetHandle))
      handleSusTweets(tweet, tweetHandle)
    else if (tweetHandle === safeHandle)
      safeDisplayName = displayName
    else if (safeDisplayName && areHandlesSimilar(safeDisplayName, displayName, 3))
      handleSusTweets(tweet, tweetHandle)
    else if (areHandlesSimilar(safeHandle, tweetHandle))
      handleSusTweets(tweet, tweetHandle)

  }

  function handleSusTweets(tweet: any, handle: string) {
    susHandles.add(handle);
    (tweet as any).style.background = '#ff000069' // set background as light red

  }
}

function areHandlesSimilar(handle1, handle2, threshold = 4) {
  if (handle1.length > handle2.length) handle1 = handle1.slice(0, handle2.length);
  if (handle2.length > handle1.length) handle2 = handle2.slice(0, handle1.length);

  if (handle1 === handle2) return true;
  const distance = levenshteinDistance(handle1, handle2);
  return distance <= threshold; // or whatever threshold you consider as "similar"

  function levenshteinDistance(a, b) {
    const matrix = [];

    // increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    // increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
            Math.min(matrix[i][j - 1] + 1, // insertion
              matrix[i - 1][j] + 1)); // deletion
        }
      }
    }

    return matrix[b.length][a.length];
  }
}

const debounceTimers = {} as any

function debounce(func, delay) {
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(debounceTimers[delay]);
    debounceTimers[delay] = setTimeout(() => func.apply(context, args), delay);
  }
}
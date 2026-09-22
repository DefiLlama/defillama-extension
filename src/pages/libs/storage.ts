
import Browser from "webextension-polyfill";
const isUpdating: {
  [key: string]: boolean
} = {}

// concurrent callers share the same in-flight request instead of getting undefined back
const inFlight: {
  [key: string]: Promise<any>
} = {}

const lastUpdated: {
  [key: string]: number
} = {}

const currentData: {
  [key: string]: any
} = {}

export async function fetchData({
  key, updateFrequency, getData,
}: {
  updateFrequency: number,
  key: string,
  getData: any,
}): Promise<any> {


  if (isUpdating[key] && inFlight[key])
    return inFlight[key];

  const timeNow = Math.floor(Date.now() / 1000);
  const lastUpdatedTime = lastUpdated[key] ?? 0;


  if (timeNow - lastUpdatedTime < updateFrequency)
    return currentData[key]


  isUpdating[key] = true;
  inFlight[key] = _fetchData().finally(() => { delete inFlight[key]; });
  currentData[key] = await inFlight[key];
  return currentData[key]

  async function _fetchData(): Promise<any> {
    let data = {}
    try {
      const cookieKey = 'llama.fi-' + key

      let { lastUpdatedTime = 0, data: storedData } = await getDataFromStorage(cookieKey);
      if (!storedData || Object.keys(storedData).length === 0 || timeNow - lastUpdatedTime > updateFrequency) {
        data = await getData()
        await setDataToStorage(cookieKey, data)
        lastUpdated[key] = timeNow
        currentData[key] = data
      } else {
        data = storedData
      }
      isUpdating[key] = false;
      return data
    } catch (error) {

    }

    isUpdating[key] = false;
    return data
  }

  async function getDataFromStorage(key) {
    const res = await Browser.storage.local.get([key])
    const item = res[key]
    return item ? JSON.parse(item) : { lastUpdatedTime: 0, data: {} }
  }

  async function setDataToStorage(key, data) {
    const value = JSON.stringify({ lastUpdatedTime: timeNow, data })
    await Browser.storage.local.set({[key]: value})
  }
}

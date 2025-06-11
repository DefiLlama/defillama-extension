
import Browser from "webextension-polyfill";
const isUpdating: {
  [key: string]: boolean
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

  // return current data while updating
  if (isUpdating[key])
    return currentData[key];

  const timeNow = Math.floor(Date.now() / 1000);
  const lastUpdatedTime = lastUpdated[key] ?? 0;

  // return current data if it's not time to update
  if (timeNow - lastUpdatedTime < updateFrequency)
    return currentData[key]


  console.log("Updating storage data for", key)

  isUpdating[key] = true;
  currentData[key] = _fetchData()
  return currentData[key]

  async function _fetchData(): Promise<any> {
    let data = {}
    try {
      const cookieKey = 'llama.fi-' + key

      let { lastUpdatedTime = 0, data } = getDataFromStorage(cookieKey);

      if (timeNow - lastUpdatedTime > updateFrequency) {
        console.log("Fetching data", key)
        data = await getData()
        setDataToStorage(cookieKey, data)
        lastUpdated[key] = timeNow
        currentData[key] = data
      }
    } catch (error) {
      console.error("Error updating storage data for", key, error);
    }

    isUpdating[key] = false;
    return data
  }

  function getDataFromStorage(key) {
    const res = Browser.storage.local.get([key])
    const item = res[key]
    return item ? JSON.parse(item) : { lastUpdatedTime: 0, }
  }

  function setDataToStorage(key, data) {
    const value = JSON.stringify({ lastUpdatedTime: timeNow, data })
    Browser.storage.local.set({[key]: value})
  }
}

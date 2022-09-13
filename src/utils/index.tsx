import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { topSitesMock } from "./mockData";
import { PROTOCOLS_API } from "./constants";

export const getIsMac = () => /(Mac|iPhone|iPod|iPad)/i.test(navigator?.platform);

export const useTopSites = () => {
  const [topSites, setTopSites] = useState<chrome.topSites.MostVisitedURL[]>([]);
  useEffect(() => {
    if (chrome?.topSites?.get) {
      // if chrome api is available, aka in browser
      chrome.topSites.get((sites) => setTopSites(sites));
    } else {
      console.log("No topSites");
      setTopSites(topSitesMock);
    }
  }, []);
  return topSites;
};

export type Protocol = {
  name: string;
  url: string;
  logo: string;
  category: string;
};

export const useProtocols = () => {
  return useQuery(["protocolsData"], async () => {
    const raw = await fetch(PROTOCOLS_API).then((res) => res.json());
    const protocols = (raw["protocols"]?.map((x: any) => ({
      name: x.name,
      url: x.url,
      logo: x.logo,
      category: x.category,
    })) ?? []) as Protocol[];
    return protocols;
  });
};

/**
 * State synced with local storage. Updates itself when local storage changes based on event listener.
 *
 * @param key a string key to store the value under
 * @param defaultValue the initial value to set the state to
 * @returns a tuple of the state and a function to update the state
 */
export const usePersistentState = <T,>(key: string, defaultValue: T): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(() => {
    const value = localStorage?.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
    return defaultValue;
  });

  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === key) {
        setState(JSON.parse(e.newValue ?? "null"));
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, [key]);

  const setPersistentState = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
    setState(value);
  };

  return [state, setPersistentState];
};

export function useLocalStorage<T>(key: string, initialValue: T) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue] as const;
}

export type SearchEngine = {
  name: string;
  logo: string;
  url: string;
};

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
  {
    name: "DuckDuckGo",
    logo: "https://duckduckgo.com/favicon.ico",
    url: "https://duckduckgo.com/?q=",
  },
  {
    name: "Google",
    logo: "https://www.google.com/favicon.ico",
    url: "https://www.google.com/search?q=",
  },
  {
    name: "Brave",
    logo: "https://icons.duckduckgo.com/ip3/brave.com.ico",
    url: "https://search.brave.com/search?q=",
  },
  {
    name: "Bing",
    logo: "https://www.bing.com/favicon.ico",
    url: "https://www.bing.com/search?q=",
  },
];

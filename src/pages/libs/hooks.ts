import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { topSitesMock } from "./mock-data";
import { Protocol, protocolsDb } from "./db";

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

/**
 * Protocols data synced with IndexedDB and updated every 4 hours using Dexie.
 *
 * @returns {Protocol[]} protocols
 */
export const useProtocols = (): Protocol[] =>
  useLiveQuery(async () => {
    return await protocolsDb.protocols.toArray();
  });

/**
 * State synced with local storage. Updates itself when local storage changes based on event listener.
 *
 * @param key a string key to store the value under
 * @param defaultValue the initial value to set the state to
 * @returns a tuple of the state and a function to update the state
 */
export const usePersistentState = <T>(key: string, defaultValue: T): [T, (value: T) => void] => {
  const [state, setState] = useState<T>(() => {
    const value = localStorage?.getItem(key);
    if (value) {
      return JSON.parse(value);
    }
    return defaultValue;
  });

  useEffect(() => {
    const localTabListener = () => {
      const value = localStorage?.getItem(key);
      const _value = JSON.parse(value ?? "null");
      const _state = JSON.stringify(state);
      if (_value !== _state) {
        setState(_value);
      }
    };
    window.addEventListener("set_persistent_state", localTabListener);
    return () => window.removeEventListener("set_persistent_state", localTabListener);
  }, [key]);

  useEffect(() => {
    const crossTabListener = (e: StorageEvent) => {
      if (e.key === key) {
        setState(JSON.parse(e.newValue ?? "null"));
      }
    };
    window.addEventListener("storage", crossTabListener);
    return () => window.removeEventListener("storage", crossTabListener);
  }, [key]);

  const setPersistentState = (value: T) => {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("set_persistent_state"));
    setState(value);
  };

  return [state, setPersistentState];
};

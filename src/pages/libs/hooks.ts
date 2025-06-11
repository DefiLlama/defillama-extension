import { useCallback, useEffect, useState } from "react";
import Browser from "webextension-polyfill";

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

// Updated from:
// https://github.com/onikienko/use-chrome-storage/blob/master/src/useChromeStorage.js

export const useBrowserStorage = <T>(
  area: "local" | "sync",
  key: string,
  initialValue?: T,
): [T | undefined, (value: T) => void, boolean, string | undefined] => {
  const [state, setState] = useState();
  const [isPersistent, setIsPersistent] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const keyObj = initialValue === undefined ? key : { [key]: initialValue };
    Browser.storage[area]
      .get(keyObj)
      .then((res) => {
        setState(res[key]);
        setIsPersistent(true);
        setError(undefined);
      })
      .catch((error) => {
        setIsPersistent(false);
        setError(error);
      });
  }, [key, initialValue]);

  const updateValue = useCallback(
    (newValue: any) => {
      const toStore = typeof newValue === "function" ? newValue(state) : newValue;

      Browser.storage[area]
        .set({ [key]: toStore })
        .then(() => {
          setIsPersistent(true);
          setError(undefined);
        })
        .catch((error) => {
          // set newValue to local state because Browser.storage.onChanged won't be fired in error case
          setState(toStore);
          setIsPersistent(false);
          setError(error);
        });
    },
    [key, state],
  );

  useEffect(() => {
    const onChange = (changes: any, areaName: string) => {
      if (areaName === area && key in changes) {
        setState(changes[key].newValue);
        setIsPersistent(true);
        setError(undefined);
      }
    };

    Browser.storage.onChanged.addListener(onChange);

    return () => {
      Browser.storage.onChanged.removeListener(onChange);
    };
  }, [key]);

  return [state, updateValue, isPersistent, error];
};

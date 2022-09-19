// forked from cmdk to support custom components

import * as React from "react";
import fuzzyScore from "../fuzzyScore";
import { Command } from "./Command";
import { Dialog } from "./Dialog";
import { Empty } from "./Empty";
import { Group } from "./Group";
import { Input } from "./Input";
import { Item } from "./Item";
import { List } from "./List";
import { Loading } from "./Loading";
import { Separator } from "./Separator";
import { CommandProps, State } from "./types";
import { useStore, useCommand } from "./contexts";
import { VALUE_ATTR } from "./constants";

export const defaultFilter: CommandProps["_filter"] = (value, search) => fuzzyScore(value, search);

const pkg = Object.assign(Command, {
  List: List,
  Item: Item,
  Input: Input,
  Group: Group,
  Separator: Separator,
  Dialog: Dialog,
  Empty: Empty,
  Loading: Loading,
});
export { useCmdk as useCommandState };
export { pkg as Command };

/**
 *
 *
 * Helpers
 *
 *
 */

export function findNextSibling(el: Element, selector: string) {
  let sibling = el.nextElementSibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.nextElementSibling;
  }
}

export function findPreviousSibling(el: Element, selector: string) {
  let sibling = el.previousElementSibling;

  while (sibling) {
    if (sibling.matches(selector)) return sibling;
    sibling = sibling.previousElementSibling;
  }
}

export function useAsRef<T>(data: T) {
  const ref = React.useRef<T>(data);

  useLayoutEffect(() => {
    ref.current = data;
  });

  return ref;
}

export const useLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;

export function useLazyRef<T>(fn: () => T) {
  const ref = React.useRef<T>();

  if (ref.current === undefined) {
    ref.current = fn();
  }

  return ref as React.MutableRefObject<T>;
}

// ESM is still a nightmare with Next.js so I'm just gonna copy the package code in
// https://github.com/gregberge/react-merge-refs
// Copyright (c) 2020 Greg Bergé
export function mergeRefs<T = any>(refs: Array<React.MutableRefObject<T> | React.LegacyRef<T>>): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

/** Run a selector against the store state. */
export function useCmdk<T = any>(selector: (state: State) => T) {
  const store = useStore();
  const cb = () => selector(store.snapshot());
  return React.useSyncExternalStore(store.subscribe, cb, cb);
}

export function useValue(
  id: string,
  ref: React.RefObject<HTMLElement>,
  deps: (string | React.ReactNode | React.RefObject<HTMLElement>)[],
) {
  const valueRef = React.useRef<string>();
  const context = useCommand();

  useLayoutEffect(() => {
    const value = (() => {
      for (const part of deps) {
        if (typeof part === "string") {
          return part.trim().toLowerCase();
        }

        if (typeof part === "object" && "current" in part && part.current) {
          return part.current.textContent?.trim().toLowerCase();
        }
      }
    })();

    context.value(id, value);
    ref.current?.setAttribute(VALUE_ATTR, value);
    valueRef.current = value;
  });

  return valueRef;
}

/** Imperatively run a function on the next layout effect cycle. */
export const useScheduleLayoutEffect = () => {
  const [s, ss] = React.useState<object>();
  const fns = useLazyRef(() => new Map<string | number, () => void>());

  useLayoutEffect(() => {
    fns.current.forEach((f) => f());
    fns.current = new Map();
  }, [s]);

  return (id: string | number, cb: () => void) => {
    fns.current.set(id, cb);
    ss({});
  };
};

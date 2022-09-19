import * as RadixDialog from "@radix-ui/react-dialog";
import * as React from "react";
import * as Chakra from "@chakra-ui/react";

type Children = { children?: React.ReactNode };
type DivProps = React.HTMLAttributes<HTMLDivElement>;
export type LoadingProps = Children & {
  /** Estimated progress of loading asynchronous options. */
  progress?: number;
};
export type EmptyProps = Children & DivProps & {};
export type SeparatorProps = DivProps & {
  /** Whether this separator should always be rendered. Useful if you disable automatic filtering. */
  alwaysRender?: boolean;
};
export type DialogProps = RadixDialog.DialogProps & CommandProps;
export type ListProps = Children & DivProps & {};
export type ItemProps = Children &
  Omit<DivProps, "disabled" | "onSelect" | "value"> & {
    /** Whether this item is currently disabled. */
    disabled?: boolean;
    /** Event handler for when this item is selected, either via click or keyboard selection. */
    onSelect?: (value: string) => void;
    /**
     * A unique value for this item.
     * If no value is provided, it will be inferred from `children` or the rendered `textContent`. If your `textContent` changes between renders, you _must_ provide a stable, unique `value`.
     */
    value?: string;
  };
export type GroupProps = Children &
  Omit<DivProps, "heading" | "value"> & {
    /** Optional heading to render for this group. */
    heading?: React.ReactNode;
    /** If no heading is provided, you must provie a value that is unique for this group. */
    value?: string;
  };
export type InputProps = Omit<Chakra.InputProps, "value" | "onChange" | "type"> & {
  /**
   * Optional controlled state for the value of the search input.
   */
  value?: string;
  /**
   * Event handler called when the search value changes.
   */
  onValueChange?: (search: string) => void;
};
export type CommandProps = Children &
  Chakra.BoxProps & {
    /**
     * Accessible label for this command menu. Not shown visibly.
     */
    label?: string;
    /**
     * Optionally set to `false` to turn off the automatic filtering and sorting.
     * If `false`, you must conditionally render valid items based on the search query yourself.
     */
    shouldFilter?: boolean;
    /**
     * Custom filter function for whether each command menu item should matches the given search query.
     * It should return a number between 0 and 1, with 1 being the best match and 0 being hidden entirely.
     * By default, uses the `command-score` library.
     */
    filter?: (value: string, search: string) => number;
    /**
     * Optional controlled state of the selected command menu item.
     */
    value?: string;
    /**
     * Event handler called when the selected item of the menu changes.
     */
    onValueChange?: (value: string) => void;
  };
export type Context = {
  value: (id: string, value: string) => void;
  item: (id: string, groupId: string) => () => void;
  group: (id: string) => () => void;
  filter: () => boolean;
  label: string;
  // Ids
  listId: string;
  labelId: string;
  inputId: string;
};
export type State = {
  search: string;
  value: string;
  filtered: { count: number; items: Map<string, number>; groups: Set<string> };
};
export type Store = {
  subscribe: (callback: () => void) => () => void;
  snapshot: () => State;
  setState: <K extends keyof State>(key: K, value: State[K], opts?: any) => void;
  emit: () => void;
};

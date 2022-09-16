import * as React from "react";
import { SeparatorProps } from "./types";
import { useCmdk, mergeRefs } from "./index";

/**
 * A visual and semantic separator between items or groups.
 * Visible when the search query is empty or `alwaysRender` is true, hidden otherwise.
 */
export const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>((props, forwardedRef) => {
  const { alwaysRender, ...etc } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const render = useCmdk((state) => !state.search);

  if (!alwaysRender && !render)
    return null;
  return <div ref={mergeRefs([ref, forwardedRef])} {...etc} cmdk-separator="" role="separator" />;
});

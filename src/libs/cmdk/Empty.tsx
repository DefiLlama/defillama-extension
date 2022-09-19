import * as React from "react";
import { EmptyProps } from "./types";
import { useCmdk } from "./index";

/**
 * Automatically renders when there are no results for the search query.
 */
export const Empty = React.forwardRef<HTMLDivElement, EmptyProps>((props, forwardedRef) => {
  const isFirstRender = React.useRef(true);
  const render = useCmdk((state) => state.filtered.count === 0);

  React.useEffect(() => {
    isFirstRender.current = false;
  }, []);

  if (isFirstRender.current || !render) return null;
  return <div ref={forwardedRef} {...props} cmdk-empty="" role="presentation" />;
});

import * as React from "react";
import { EmptyProps } from "./types";
import { useCmdk } from "./index";
import * as Chakra from "@chakra-ui/react";

/**
 * Automatically renders when there are no results for the search query.
 */
export const Empty = Chakra.forwardRef<EmptyProps, "div">((props, forwardedRef) => {
  const isFirstRender = React.useRef(true);
  const render = useCmdk((state) => state.filtered.count === 0);

  React.useEffect(() => {
    isFirstRender.current = false;
  }, []);

  if (isFirstRender.current || !render) return null;
  return <Chakra.Box ref={forwardedRef} {...props} cmdk-empty="" role="presentation" />;
});

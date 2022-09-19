import * as React from "react";
import { LoadingProps } from "./types";
import * as Chakra from "@chakra-ui/react";

/**
 * You should conditionally render this with `progress` while loading asynchronous items.
 */
export const Loading = Chakra.forwardRef<LoadingProps, "div">((props, forwardedRef) => {
  const { progress, children, ...etc } = props;

  return (
    <Chakra.Box
      ref={forwardedRef}
      {...etc}
      cmdk-loading=""
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading..."
    >
      <Chakra.Box aria-hidden>{children}</Chakra.Box>
    </Chakra.Box>
  );
});

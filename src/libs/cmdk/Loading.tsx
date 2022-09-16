import * as React from "react";
import { LoadingProps } from "./types";

/**
 * You should conditionally render this with `progress` while loading asynchronous items.
 */
export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>((props, forwardedRef) => {
  const { progress, children, ...etc } = props;

  return (
    <div
      ref={forwardedRef}
      {...etc}
      cmdk-loading=""
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading..."
    >
      <div aria-hidden>{children}</div>
    </div>
  );
});

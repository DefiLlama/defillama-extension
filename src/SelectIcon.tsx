import * as React from "react";

export const DefaultIcon = (props: React.ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z" />
  </svg>
);

export const SelectIcon = (props: React.ComponentProps<"svg">) => (
  <DefaultIcon
    style={{ width: "1em", height: "1em", color: "currentColor" }}
    role="presentation"
    focusable={false}
    aria-hidden
    {...props}
  />
);

import * as React from "react";
import { GroupProps } from "./types";
import { useCmdk, useLayoutEffect, useValue, mergeRefs } from "./index";
import { useCommand, GroupContext } from "./contexts";

/**
 * Group command menu items together with a heading.
 * Grouped items are always shown together.
 */
export const Group = React.forwardRef<HTMLDivElement, GroupProps>((props, forwardedRef) => {
  const { heading, children, ...etc } = props;
  const id = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLDivElement>(null);
  const headingId = React.useId();
  const context = useCommand();
  const render = useCmdk((state) => context._filter() === false ? true : !state.search ? true : state.filtered.groups.has(id)
  );

  useLayoutEffect(() => {
    return context.group(id);
  }, []);

  useValue(id, ref, [props.value, props.heading, headingRef]);

  const inner = <GroupContext.Provider value={id}>{children}</GroupContext.Provider>;

  return (
    <div
      ref={mergeRefs([ref, forwardedRef])}
      {...etc}
      cmdk-group=""
      role="presentation"
      hidden={render ? undefined : true}
    >
      {heading && (
        <div ref={headingRef} cmdk-group-heading="" aria-hidden id={headingId}>
          {heading}
        </div>
      )}
      <div cmdk-group-items="" role="group" aria-labelledby={heading ? headingId : undefined}>
        {inner}
      </div>
    </div>
  );
});

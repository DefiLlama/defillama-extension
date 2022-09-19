import * as React from "react";
import { GroupProps } from "./types";
import { useCmdk, useLayoutEffect, useValue, mergeRefs } from "./index";
import { useCommand, GroupContext } from "./contexts";
import * as Chakra from "@chakra-ui/react";

/**
 * Group command menu items together with a heading.
 * Grouped items are always shown together.
 */
export const Group = Chakra.forwardRef<GroupProps, "div">((props, forwardedRef) => {
  const { heading, children, ...etc } = props;
  const id = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const headingRef = React.useRef<HTMLDivElement>(null);
  const headingId = React.useId();
  const context = useCommand();
  const render = useCmdk((state) =>
    context._filter() === false ? true : !state.search ? true : state.filtered.groups.has(id),
  );

  useLayoutEffect(() => {
    return context.group(id);
  }, []);

  useValue(id, ref, [props.value, props.heading, headingRef]);

  const inner = <GroupContext.Provider value={id}>{children}</GroupContext.Provider>;

  return (
    <Chakra.Box
      ref={mergeRefs([ref, forwardedRef])}
      {...etc}
      cmdk-group=""
      role="presentation"
      hidden={render ? undefined : true}
    >
      {heading && (
        <Chakra.Box ref={headingRef} cmdk-group-heading="" aria-hidden id={headingId}>
          {heading}
        </Chakra.Box>
      )}
      <Chakra.Box cmdk-group-items="" role="group" aria-labelledby={heading ? headingId : undefined}>
        {inner}
      </Chakra.Box>
    </Chakra.Box>
  );
});

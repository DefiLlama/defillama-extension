import * as React from "react";
import { ListProps } from "./types";
import { mergeRefs } from "./index";
import { useCommand } from "./contexts";
import * as Chakra from "@chakra-ui/react";

/**
 * Contains `Item`, `Group`, and `Separator`.
 * Use the `--cmdk-list-height` CSS variable to animate height based on the number of results.
 */
export const List = Chakra.forwardRef<ListProps, "div">((props, forwardedRef) => {
  const { children, ...etc } = props;
  const ref = React.useRef<HTMLDivElement>(null);
  const height = React.useRef<HTMLDivElement>(null);
  const context = useCommand();

  React.useEffect(() => {
    if (height.current && ref.current) {
      const el = height.current;
      const wrapper = ref.current;
      const observer = new ResizeObserver(() => {
        const height = el.getBoundingClientRect().height;
        wrapper.style.setProperty(`--cmdk-list-height`, height.toFixed(1) + "px");
      });
      observer.observe(el);
      return () => observer.unobserve(el);
    }
  }, []);

  return (
    <Chakra.Box
      ref={mergeRefs([ref, forwardedRef])}
      {...etc}
      cmdk-list=""
      role="listbox"
      aria-label="Suggestions"
      id={context.listId}
      aria-labelledby={context.inputId}
    >
      <Chakra.Box ref={height} cmdk-list-sizer="">
        {children}
      </Chakra.Box>
    </Chakra.Box>
  );
});

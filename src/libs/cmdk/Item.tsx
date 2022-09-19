import * as React from "react";
import { ItemProps } from "./types";
import { useAsRef, useLayoutEffect, useValue, useCmdk, mergeRefs } from "./index";
import { GroupContext, useCommand, useStore } from "./contexts";
import { SELECT_EVENT } from "./constants";

/**
 * Command menu item. Becomes active on pointer enter or through keyboard navigation.
 * Preferably pass a `value`, otherwise the value will be inferred from `children` or
 * the rendered item's `textContent`.
 */
export const Item = React.forwardRef<HTMLDivElement, ItemProps>((props, forwardedRef) => {
  const id = React.useId();
  const ref = React.useRef<HTMLDivElement>(null);
  const groupId = React.useContext(GroupContext);
  const context = useCommand();
  const propsRef = useAsRef(props);

  useLayoutEffect(() => {
    return context.item(id, groupId);
  }, []);

  const value = useValue(id, ref, [props.value, props.children, ref]);

  const store = useStore();
  const selected = useCmdk((state) => state.value && state.value === value.current);
  const render = useCmdk((state) => context._filter() === false ? true : !state.search ? true : state.filtered.items.get(id) > 0
  );

  React.useEffect(() => {
    const element = ref.current;
    if (!element || props.disabled)
      return;
    element.addEventListener(SELECT_EVENT, onSelect);
    return () => element.removeEventListener(SELECT_EVENT, onSelect);
  }, [render, props.onSelect, props.disabled]);

  function onSelect() {
    propsRef.current.onSelect?.(value.current);
  }

  function select() {
    store.setState("value", value.current, true);
  }

  if (!render)
    return null;

  const { disabled, value: _, onSelect: __, ...etc } = props;

  return (
    <div
      ref={mergeRefs([ref, forwardedRef])}
      {...etc}
      cmdk-item=""
      role="option"
      aria-disabled={disabled || undefined}
      aria-selected={selected || undefined}
      onPointerMove={disabled ? undefined : select}
      onClick={disabled ? undefined : onSelect}
    >
      {props.children}
    </div>
  );
});

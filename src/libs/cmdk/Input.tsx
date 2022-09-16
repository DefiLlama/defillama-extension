import * as React from "react";
import { InputProps } from "./types";
import { useCmdk } from "./index";
import { useStore, useCommand } from "./contexts";

/**
 * Command menu input.
 * All props are forwarded to the underyling `input` element.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>((props, forwardedRef) => {
  const { onValueChange, ...etc } = props;
  const isControlled = props.value != null;
  const store = useStore();
  const search = useCmdk((state) => state.search);
  const context = useCommand();

  React.useEffect(() => {
    if (props.value != null) {
      store.setState("search", props.value);
    }
  }, [props.value]);

  return (
    <input
      ref={forwardedRef}
      {...etc}
      cmdk-input=""
      autoComplete="off"
      autoCorrect="off"
      spellCheck={false}
      aria-autocomplete="list"
      role="combobox"
      aria-expanded={true}
      aria-controls={context.listId}
      aria-labelledby={context.labelId}
      id={context.inputId}
      type="text"
      value={isControlled ? props.value : search}
      onChange={(e) => {
        if (!isControlled) {
          store.setState("search", e.target.value);
        }

        onValueChange?.(e.target.value);
      }} />
  );
});

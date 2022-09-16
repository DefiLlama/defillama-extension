import * as RadixDialog from "@radix-ui/react-dialog";
import * as React from "react";
import { DialogProps } from "./types";
import { Command } from "./index";

/**
 * Renders the command menu in a Radix Dialog.
 */
export const Dialog = React.forwardRef<HTMLDivElement, DialogProps>((props, forwardedRef) => {
  const { open, onOpenChange, ...etc } = props;
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay cmdk-overlay="" />
        <RadixDialog.Content aria-label={props.label} cmdk-dialog="">
          <Command ref={forwardedRef} {...etc} />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
});

import * as React from "react";
import { Context, Store } from "./types";


export const CommandContext = React.createContext<Context>(undefined);
export const useCommand = () => React.useContext(CommandContext);

export const StoreContext = React.createContext<Store>(undefined);
export const useStore = () => React.useContext(StoreContext);

export const GroupContext = React.createContext<string>(undefined);

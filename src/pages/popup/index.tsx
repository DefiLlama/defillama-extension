import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Popup from "./Popup";

const queryClient = new QueryClient();

const config = {
  initialColorMode: "system",
  useSystemColorMode: false, // follow the system until the user toggles; then remember the choice
  disableTransitionOnChange: false,
};

const theme = extendTheme({
  config,
  styles: {
    global: {
      // the popup scrolls when settings expand; hide the scrollbar so its appearance doesn't shift the layout
      html: { scrollbarWidth: "none" },
      "html::-webkit-scrollbar": { display: "none" },
    },
  },
});

const rootElement = document.querySelector("body");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ChakraProvider theme={theme}>
        <ColorModeScript />
        <Popup />
      </ChakraProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

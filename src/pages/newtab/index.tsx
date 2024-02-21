import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, ColorModeScript, extendTheme } from "@chakra-ui/react";
import Newtab from "./Newtab";

const config = {
  initialColorMode: "system",
  useSystemColorMode: true,
  disableTransitionOnChange: false,
};

const theme = extendTheme({
  config,
});

const rootElement = document.querySelector("body");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <Newtab />
    </ChakraProvider>
  </React.StrictMode>,
);

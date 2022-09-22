import { createRoot } from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import Popup from "./Popup";

function init() {
  const appContainer = document.querySelector("body");
  if (!appContainer) {
    throw new Error("Can not find AppContainer");
  }
  const root = createRoot(appContainer);
  root.render(
    <ChakraProvider>
      <Popup />
    </ChakraProvider>,
  );
}

init();

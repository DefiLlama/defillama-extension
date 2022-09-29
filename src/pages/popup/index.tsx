import React from "react";
import "@pages/popup/index.css";
import Popup from "@pages/popup/Popup";

function init() {
  const appContainer = document.querySelector("#app-container");
  if (!appContainer) {
    throw new Error("Can not find AppContainer");
  }
  const root = createRoot(appContainer);
  root.render(<Popup />);
}

init();

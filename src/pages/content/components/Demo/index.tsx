import { createRoot } from "react-dom/client";
import App from "@src/pages/content/components/Demo/app";

const root = document.createElement("div");
root.id = "defillama-extension-content-view-root";
document.body.append(root);

createRoot(root).render(<App />);

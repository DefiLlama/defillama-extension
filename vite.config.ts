import { defineConfig } from "vite";
import webExtension from "vite-plugin-web-extension";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

function root(...paths: string[]): string {
  return resolve(__dirname, ...paths);
}

// https://vitejs.dev/config/
export default defineConfig({
  root: "src",
  build: {
    outDir: root("dist"),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    webExtension({
      manifest: root("src/manifest.json"),
      assets: "assets",
      browser: process.env.TARGET,
      webExtConfig: {
        firefox: "firefox",
      },
      verbose: true,
    }),
  ],
  // server: {
  //   port: 8000,
  //   watch: {
  //     usePolling: true,
  //   },
  // },
});

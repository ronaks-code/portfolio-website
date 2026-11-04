import { defineConfig, type Plugin } from "vite";
import { slots } from "./src/render.ts";

// Replaces {{slot}} markers in index.html with build-time rendered sections.
function contentSlots(): Plugin {
  return {
    name: "content-slots",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        return html.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (m, key: string) => {
          const fn = slots[key];
          if (!fn) throw new Error(`Unknown content slot: ${m}`);
          return fn();
        });
      },
    },
  };
}

export default defineConfig({
  plugins: [contentSlots()],
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600, // three.js hero chunk, lazy-loaded
  },
});

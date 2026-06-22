import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds the React calculator into a single self-contained dist/index.html
// (all JS + CSS inlined, no runtime CDNs). build-droppable.mjs then strips it
// down to a drop-in fragment for voltsite.
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    minify: "esbuild",
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
  },
});

import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// Every folder in widgets/ with an index.html is one widget, built to dist/<name>/index.html for zpack.json
const widgets = readdirSync(resolve(import.meta.dirname, "widgets"), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

export default defineConfig({
  root: "widgets",
  base: "./",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(widgets.map((name) => [name, resolve(import.meta.dirname, "widgets", name, "index.html")])),
    },
  },
});

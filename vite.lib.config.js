import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// The widgets as a library for web pages: lib/index.js, with React left to the page
export default defineConfig({
  plugins: [react()],
  publicDir: false,
  build: {
    outDir: "lib",
    emptyOutDir: true,
    lib: { entry: resolve(import.meta.dirname, "src/lib/index.js"), formats: ["es"], fileName: "index" },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime"] },
  },
});

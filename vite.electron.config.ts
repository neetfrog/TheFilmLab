import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Electron build config - for main.ts and preload.ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  optimizeDeps: {
    exclude: ["electron"],
  },
  build: {
    target: "node20",
    lib: {
      entry: {
        main: path.resolve(__dirname, "electron/main.ts"),
        preload: path.resolve(__dirname, "electron/preload.ts"),
      },
      name: "TheFilmLab",
      formats: ["cjs"],
    },
    rollupOptions: {
      external: ["electron", "path", "url", "fs"],
      output: {
        dir: "dist/electron",
        format: "cjs",
        entryFileNames: "[name].cjs",
      },
    },
    minify: false,
  },
});

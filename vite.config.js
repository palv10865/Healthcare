import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const serviceWorker = readFileSync(new URL("./service-worker.js", import.meta.url), "utf8");

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "emit-service-worker",
      apply: "build",
      generateBundle() {
        this.emitFile({ type: "asset", fileName: "service-worker.js", source: serviceWorker });
      },
    },
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
    allowedHosts: [".trycloudflare.com"],
  },
});

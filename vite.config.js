import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/site-caminho-do-pei/" : "/",
  build: {
    rollupOptions: {
      input: {
        index: resolve(process.cwd(), "index.html"),
        termos: resolve(process.cwd(), "termos.html"),
        privacidade: resolve(process.cwd(), "privacidade.html"),
      },
    },
  },
});

import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

// Selvstændig konfiguration (ingen Lovable). Nitro vælger selv hosting-preset ud fra miljøet:
// Vercel, Netlify og Cloudflare genkendes automatisk; lokalt bygges en Node-server (.output/server/index.mjs).
export default defineConfig({
  server: { port: 3000 },
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart({
      pages: ["/", "/privatliv", "/vilkaar"].map((path) => ({ path })),
      prerender: { enabled: true, autoStaticPathsDiscovery: false, crawlLinks: false },
      sitemap: { enabled: false },
      server: { entry: "server" },
    }),
    nitro(),
    viteReact(),
    tailwindcss(),
  ],
});

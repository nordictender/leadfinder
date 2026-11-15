// @lovable.dev/vite-tanstack-config already includes tanstackStart, viteReact, tailwindcss,
// tsConfigPaths, nitro (cloudflare target), VITE_* env injection and the @ alias — do NOT add them.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    pages: ["/", "/privatliv", "/vilkaar"].map((path) => ({ path })),
    prerender: { enabled: true, autoStaticPathsDiscovery: false, crawlLinks: false },
    sitemap: { enabled: false },
    server: { entry: "server" },
  },
});

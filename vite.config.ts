<<<<<<< HEAD
// @lovable.dev/vite-tanstack-config already includes the following - do NOT add them manually
=======
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
<<<<<<< HEAD
// @cloudflare/vite-plugin builds from this - wrangler.jsonc main alone is insufficient.
=======
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});

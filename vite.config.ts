// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv } from "vite";
import type { LovableViteTanstackOptions } from "@lovable.dev/vite-tanstack-config";

const normalizeAuthorizationHeader = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  return /^Bearer\s+\S+/i.test(trimmed)
    ? trimmed
    : `Bearer ${trimmed.replace(/^Bearer\s*/i, "").trim()}`;
};

const normalizeAuthApiBase = (value?: string) => {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.startsWith("/")) return "https://auth.mennuai.com";
  return trimmed.replace(/\/$/, "");
};

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
const createConfig = ({ mode }: ConfigEnv): LovableViteTanstackOptions => {
  const env = loadEnv(mode, process.cwd(), "");
  const authApiBase = normalizeAuthApiBase(env.AUTH_API_BASE || env.VITE_AUTH_API_BASE);
  const authorization = normalizeAuthorizationHeader(
    env.AUTHORIZATION_HEADER ||
      env.AUTHORIZATION ||
      env.Authorization ||
      env.VITE_AUTHORIZATION_HEADER,
  );
  const clientSecret =
    env.CLIENT_SECRET ||
    env.CLIENT_HEADER_SECRET ||
    env["Client-Secret"] ||
    env.VITE_CLIENT_SECRET ||
    env.VITE_CLIENT_HEADER_SECRET;

  return {
    tanstackStart: {
      server: { entry: "server" },
    },
    vite: {
      server: {
        proxy: {
          "/auth-api": {
            target: authApiBase,
            changeOrigin: true,
            secure: true,
            rewrite: (path: string) => path.replace(/^\/auth-api/, ""),
            headers: {
              ...(authorization ? { Authorization: authorization } : {}),
              ...(clientSecret ? { "Client-Secret": clientSecret } : {}),
              Accept: "application/json",
            },
          },
        },
      },
    },
  };
};

export default defineConfig(createConfig as (env: ConfigEnv) => LovableViteTanstackOptions);

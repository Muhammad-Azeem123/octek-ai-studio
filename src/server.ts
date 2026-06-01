import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const AUTH_PROXY_PREFIX = "/auth-api";
const DEFAULT_AUTH_API_BASE = "https://auth.mennuai.com";
const WEBHOOK_PROXY_PREFIX = "/webhook-api";
const DEFAULT_N8N_WEBHOOK_BASE = "https://n8n.octek.org/webhook";

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

function getRuntimeEnv(env: unknown): Record<string, string | undefined> {
  const processEnv =
    (globalThis as typeof globalThis & { process?: { env?: Record<string, string | undefined> } })
      .process?.env ?? {};
  return {
    ...processEnv,
    ...(env && typeof env === "object" ? (env as Record<string, string | undefined>) : {}),
  };
}

function envValue(env: Record<string, string | undefined>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function normalizeAuthorizationHeader(value?: string): string | undefined {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return undefined;
  return /^Bearer\s+\S+/i.test(trimmed)
    ? trimmed
    : `Bearer ${trimmed.replace(/^Bearer\s*/i, "").trim()}`;
}

function normalizeAuthApiBase(value?: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.startsWith("/")) return DEFAULT_AUTH_API_BASE;
  return trimmed.replace(/\/$/, "");
}

function normalizeWebhookBase(value?: string): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || trimmed.startsWith("/")) return DEFAULT_N8N_WEBHOOK_BASE;
  return trimmed.replace(/\/$/, "");
}

function authCorsHeaders(request: Request): Headers {
  const origin = request.headers.get("origin") ?? new URL(request.url).origin;
  return new Headers({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,client-secret",
    "access-control-max-age": "86400",
    vary: "origin",
  });
}

async function proxyAuthRequest(request: Request, env: unknown): Promise<Response> {
  const url = new URL(request.url);
  const runtimeEnv = getRuntimeEnv(env);
  const authApiBase = normalizeAuthApiBase(
    envValue(runtimeEnv, ["AUTH_API_BASE", "VITE_AUTH_API_BASE"]),
  );

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) });
  }

  const upstreamUrl = `${authApiBase}${url.pathname.slice(AUTH_PROXY_PREFIX.length)}${url.search}`;
  const headers = new Headers({
    Accept: "application/json",
  });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  // Prefer Wrangler / deploy env. In `vite dev`, worker `process.env` often lacks non-VITE_ vars
  // from `.env`, while the browser already sends these on `/auth-api/*` (see authService.js).
  const authorizationFromEnv = normalizeAuthorizationHeader(
    envValue(runtimeEnv, [
      "AUTHORIZATION_HEADER",
      "AUTHORIZATION",
      "Authorization",
      "VITE_AUTHORIZATION_HEADER",
      "VITE_AUTHORIZATION",
      "VITE_AUTH_TOKEN",
    ]),
  );
  const clientSecretFromEnv = envValue(runtimeEnv, [
    "CLIENT_SECRET",
    "CLIENT_HEADER_SECRET",
    "Client-Secret",
    "VITE_CLIENT_SECRET",
    "VITE_CLIENT_HEADER_SECRET",
    "VITE_Client-Secret",
  ]);

  const authorization =
    authorizationFromEnv ?? normalizeAuthorizationHeader(request.headers.get("authorization") ?? undefined);
  const clientSecret = clientSecretFromEnv || request.headers.get("client-secret")?.trim();

  if (authorization) headers.set("Authorization", authorization);
  if (clientSecret) headers.set("Client-Secret", clientSecret);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  const corsHeaders = authCorsHeaders(request);
  corsHeaders.forEach((value, key) => responseHeaders.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

async function proxyWebhookRequest(request: Request, env: unknown): Promise<Response> {
  const url = new URL(request.url);
  const runtimeEnv = getRuntimeEnv(env);
  const webhookBase = normalizeWebhookBase(
    envValue(runtimeEnv, ["N8N_WEBHOOK_BASE", "VITE_N8N_WEBHOOK_BASE"]),
  );

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: authCorsHeaders(request) });
  }

  const upstreamUrl = `${webhookBase}${url.pathname.slice(WEBHOOK_PROXY_PREFIX.length)}${url.search}`;
  const headers = new Headers({ Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const response = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  const corsHeaders = authCorsHeaders(request);
  corsHeaders.forEach((value, key) => responseHeaders.set(key, value));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const pathname = new URL(request.url).pathname;
      if (pathname === AUTH_PROXY_PREFIX || pathname.startsWith(`${AUTH_PROXY_PREFIX}/`)) {
        return await proxyAuthRequest(request, env);
      }
      if (pathname === WEBHOOK_PROXY_PREFIX || pathname.startsWith(`${WEBHOOK_PROXY_PREFIX}/`)) {
        return await proxyWebhookRequest(request, env);
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};

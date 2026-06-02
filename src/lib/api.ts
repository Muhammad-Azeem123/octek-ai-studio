// API integration for OCTEK AI Builder webhooks
const DEFAULT_WEBHOOK_BASE = "https://n8n.octek.org/webhook";
const WEBHOOK_PROXY_PREFIX = "/webhook-api";

/** Browser uses same-origin proxy (server.ts) to avoid n8n CORS; SSR uses the real webhook host. */
function resolveWebhookBase(): string {
  const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : {};
  const raw = viteEnv.VITE_N8N_WEBHOOK_BASE ?? viteEnv.N8N_WEBHOOK_BASE;
  if (raw && String(raw).trim()) {
    const trimmed = String(raw).trim().replace(/\/$/, "");
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return trimmed;
  }
  if (typeof window !== "undefined") return WEBHOOK_PROXY_PREFIX;
  return DEFAULT_WEBHOOK_BASE;
}

const BASE = resolveWebhookBase();

export interface AppItem {
  app_id: string;
  name: string;
  app_mode: string;
  repo_url: string;
}

export interface ConvoMessage {
  role: "human" | "ai";
  content: string;
  raw?: string;
}

export interface UploadedFilePayload {
  filename: string;
  media_type: string;
  base64: string;
}

function normalizeUserId(userId?: string | null): string | null {
  const trimmed = String(userId ?? "").trim();
  return trimmed ? trimmed : null;
}

function withUserId<T extends Record<string, unknown>>(
  body: T,
  user_id?: string | null,
): T & { user_id?: string; uuid?: string; userId?: string } {
  const normalized = normalizeUserId(user_id);
  if (!normalized) return body;
  // Some webhook nodes read `user_id`, others map `uuid`/`userId`.
  return { ...body, user_id: normalized, uuid: normalized, userId: normalized };
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const payload = JSON.stringify(body);
  const doFetch = async (target: string): Promise<T> => {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  };

  try {
    return await doFetch(url);
  } catch (err) {
    // Dev proxy may return a 200 with broken content-encoding.
    if (typeof window !== "undefined" && url.startsWith(WEBHOOK_PROXY_PREFIX)) {
      const fallback = `${DEFAULT_WEBHOOK_BASE}${url.slice(WEBHOOK_PROXY_PREFIX.length)}`;
      console.warn("Webhook proxy POST failed, retrying direct n8n URL", { url, err, fallback });
      return await doFetch(fallback);
    }
    throw err;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const doFetch = async (target: string): Promise<T> => {
    const res = await fetch(target, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    const text = await res.text();
    if (!text.trim()) return [] as unknown as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  };

  try {
    return await doFetch(url);
  } catch (err) {
    // In dev, the /webhook-api proxy can occasionally return a mis-encoded body.
    // Fall back to calling the n8n host directly so the UI still works.
    if (typeof window !== "undefined" && url.startsWith(WEBHOOK_PROXY_PREFIX)) {
      const fallback = `${DEFAULT_WEBHOOK_BASE}${url.slice(WEBHOOK_PROXY_PREFIX.length)}`;
      console.warn("Webhook proxy failed, retrying direct n8n URL", { url, err, fallback });
      return await doFetch(fallback);
    }
    throw err;
  }
}

function normalizeAppsResponse(data: unknown): AppItem[] {
  const parseMaybeJson = (value: unknown): unknown => {
    if (typeof value !== "string") return value;
    const trimmed = value.trim();
    if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      return value;
    }
  };

  const pickArray = (value: unknown): unknown[] => {
    const parsed = parseMaybeJson(value);
    if (Array.isArray(parsed)) return parsed;
    if (value && typeof value === "object") {
      const obj = parsed as Record<string, unknown>;
      return pickArray(obj.apps ?? obj.data ?? obj.items ?? obj.result ?? obj.body ?? []);
    }
    return [];
  };

  return pickArray(data)
    .map((item): AppItem | null => {
      const parsedItem = parseMaybeJson(item);
      if (!parsedItem || typeof parsedItem !== "object") return null;
      const raw = parsedItem as Record<string, unknown>;
      // n8n often returns [{ json: {...row} }]
      const app = (raw.json && typeof raw.json === "object"
        ? (raw.json as Record<string, unknown>)
        : raw) as Record<string, unknown>;
      // Support legacy/typoed fields from workflow tables as well.
      const appId = app.app_id ?? app.appId ?? app.app_jd ?? app.appIdd ?? app.id;
      if (!appId) return null;
      return {
        app_id: String(appId),
        name: String(app.name ?? app.app_name ?? app.appName ?? app.title ?? "Untitled"),
        app_mode: String(app.app_mode ?? app.appMode ?? app.mode ?? "html"),
        repo_url: String(app.repo_url ?? app.repoUrl ?? app.repo ?? app.app_url ?? ""),
      };
    })
    .filter(Boolean) as AppItem[];
}

function withQuery(url: string, params: Record<string, string | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
}

function userIdQueryOnly(user_id?: string | null): Record<string, string | null> {
  const normalized = normalizeUserId(user_id);
  return { user_id: normalized };
}

export const api = {
  getApps: async (user_id?: string | null) =>
    normalizeAppsResponse(
      await getJson<unknown>(withQuery(`${BASE}/get_apps_99dj348`, userIdQueryOnly(user_id))),
    ),

  detectKey: (api_key: string, user_id?: string | null) =>
    postJson<{
      provider?: string;
      detectedProvider?: string;
      message?: string;
      valid?: boolean;
      success?: boolean;
      error?: string;
    }>(`${BASE}/detect_key`, withUserId({ api_key }, user_id)),

  getConvo: (app_id: string) =>
    postJson<unknown>(`${BASE}/get_convo_99dj348`, { app_id }),

  uploadFiles: (files: UploadedFilePayload[]) =>
    postJson<{ urls?: string[]; success?: boolean }>(`${BASE}/upload_files_99dj348`, {
      files,
    }),

  runAgent: (payload: {
    input: string;
    app_id: string;
    planning: string;
    mode: string;
    model: string;
    agent_framework: string;
    environment: string;
    api_key: string;
  }) => postJson<{ output?: string; response?: string; message?: string }>(
    `${BASE}/run_agent_99dj349`,
    payload,
  ),

  createRepo: ({
    user_id,
    ...payload
  }: {
    name: string;
    mode: string;
    width: string;
    height: string;
    user_id?: string | null;
  }) =>
    postJson<{ app_id?: string; success?: boolean }>(
      `${BASE}/create_repo_99dj348`,
      withUserId(payload, user_id),
    ),
};

export function previewUrl(appId: string) {
  return `https://octek-dev-code-agent.s3.us-east-1.amazonaws.com/n8n_continue/${appId}/index.html`;
}

export function cacheBust(url: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}_cb=${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Extract user-friendly message text from raw stored prompts
export function extractUserMessage(raw: string): string {
  const m = raw.match(/User Request:\s*\n([\s\S]*?)(?:\n\nCanvas Size:|\n\n---|$)/);
  return (m ? m[1] : raw).trim();
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return value;
  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return value;
  }
}

/** Unwrap n8n / webhook envelopes until we reach messages or row data. */
function unwrapConvoPayload(data: unknown): unknown {
  let cur = parseMaybeJson(data);
  for (let depth = 0; depth < 8; depth++) {
    if (Array.isArray(cur)) {
      if (cur.length === 1) {
        cur = parseMaybeJson(cur[0]);
        continue;
      }
      const jsonItems = cur.filter(
        (item) => item && typeof item === "object" && "json" in (item as Record<string, unknown>),
      );
      if (jsonItems.length === cur.length && jsonItems.length > 0) {
        cur = jsonItems.map((item) => (item as Record<string, unknown>).json);
        continue;
      }
      break;
    }
    if (cur && typeof cur === "object") {
      const o = cur as Record<string, unknown>;
      const nested =
        o.messages ??
        o.conversation ??
        o.data ??
        o.result ??
        o.body ??
        o.json ??
        o.output;
      if (nested !== undefined && nested !== cur) {
        cur = parseMaybeJson(nested);
        continue;
      }
      break;
    }
    break;
  }
  return cur;
}

function isHumanAiPair(item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === "object" && ("human" in item || "ai" in item);
}

function expandHumanAiPairs(items: unknown[]): ConvoMessage[] {
  const out: ConvoMessage[] = [];
  for (const m of items) {
    if (!isHumanAiPair(m)) continue;
    if (m.human != null && String(m.human).trim()) {
      const raw = String(m.human);
      out.push({ role: "human", content: extractUserMessage(raw), raw });
    }
    if (m.ai != null && String(m.ai).trim()) {
      const raw = String(m.ai);
      out.push({ role: "ai", content: raw, raw });
    }
  }
  return out;
}

function collectHumanAiMessages(payload: unknown): ConvoMessage[] {
  const out: ConvoMessage[] = [];
  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      if (Array.isArray(row.messages) && row.messages.some(isHumanAiPair)) {
        out.push(...expandHumanAiPairs(row.messages));
      }
    }
    if (out.length > 0) return out;
    if (payload.some(isHumanAiPair)) return expandHumanAiPairs(payload);
  } else if (payload && typeof payload === "object") {
    const row = payload as Record<string, unknown>;
    if (Array.isArray(row.messages) && row.messages.some(isHumanAiPair)) {
      return expandHumanAiPairs(row.messages);
    }
  }
  return out;
}

function normalizePostgresRows(rows: unknown[]): ConvoMessage[] {
  const out: ConvoMessage[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const nested = r.message;
    if (nested && typeof nested === "object") {
      const msg = nested as Record<string, unknown>;
      const role = String(msg.type ?? msg.role ?? "");
      const content = msg.content ?? msg.text ?? msg.data ?? "";
      if (!String(content).trim()) continue;
      const isHuman = /human|user/i.test(role);
      const raw = String(content);
      out.push({
        role: isHuman ? "human" : "ai",
        content: isHuman ? extractUserMessage(raw) : raw,
        raw,
      });
      continue;
    }
    const role = String(r.role ?? r.type ?? "");
    const content = r.content ?? r.text ?? r.output ?? "";
    if (!String(content).trim() && !isHumanAiPair(r)) continue;
    if (isHumanAiPair(r)) {
      out.push(...expandHumanAiPairs([r]));
      continue;
    }
    const isHuman = /human|user/i.test(role);
    const raw = String(content);
    out.push({
      role: isHuman ? "human" : "ai",
      content: isHuman ? extractUserMessage(raw) : raw,
      raw,
    });
  }
  return out;
}

function normalizeRoleContentList(items: unknown[]): ConvoMessage[] {
  return items
    .map((m): ConvoMessage | null => {
      if (!m || typeof m !== "object") return null;
      const row = m as Record<string, unknown>;
      if ("human" in row || "ai" in row) return null;
      const role = String(row.role ?? row.type ?? "");
      const content = row.content ?? row.text ?? row.output ?? "";
      if (!String(content).trim()) return null;
      const isHuman = /human|user/i.test(role);
      const raw = String(content);
      return {
        role: isHuman ? "human" : "ai",
        content: isHuman ? extractUserMessage(raw) : raw,
        raw,
      };
    })
    .filter(Boolean) as ConvoMessage[];
}

// Normalize convo response into ConvoMessage[]
// Supports: [{ messages: [{ human, ai }] }], { messages: [...] }, postgres rows, n8n { json }, JSON strings
export function normalizeConvo(data: unknown): ConvoMessage[] {
  const payload = unwrapConvoPayload(data);
  if (!payload) return [];

  const paired = collectHumanAiMessages(payload);
  if (paired.length > 0) return paired;

  const rows = Array.isArray(payload) ? payload : [];
  if (rows.length > 0) {
    const fromDb = normalizePostgresRows(rows);
    if (fromDb.length > 0) return fromDb;
    const fromRoles = normalizeRoleContentList(rows);
    if (fromRoles.length > 0) return fromRoles;
  }

  return [];
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const result = r.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

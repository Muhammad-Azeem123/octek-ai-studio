// API integration for OCTEK AI Builder webhooks
const BASE = "https://n8n.octek.org/webhook";

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

function withUserId<T extends Record<string, unknown>>(body: T, user_id?: string | null): T & { user_id?: string } {
  return user_id ? { ...body, user_id } : body;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
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
}

function normalizeAppsResponse(data: unknown): AppItem[] {
  const pickArray = (value: unknown): unknown[] => {
    if (Array.isArray(value)) {
      if (value.length === 1 && value[0] && typeof value[0] === "object") {
        const obj = value[0] as Record<string, unknown>;
        const nested = obj.apps ?? obj.data ?? obj.items ?? obj.result;
        if (Array.isArray(nested)) return nested;
      }
      return value;
    }
    if (value && typeof value === "object") {
      const obj = value as Record<string, unknown>;
      return pickArray(obj.apps ?? obj.data ?? obj.items ?? obj.result ?? []);
    }
    return [];
  };

  return pickArray(data)
    .map((item): AppItem | null => {
      if (!item || typeof item !== "object") return null;
      const app = item as Record<string, unknown>;
      const appId = app.app_id ?? app.appId ?? app.id;
      if (!appId) return null;
      return {
        app_id: String(appId),
        name: String(app.name ?? app.app_name ?? app.title ?? "Untitled"),
        app_mode: String(app.app_mode ?? app.mode ?? "html"),
        repo_url: String(app.repo_url ?? app.repoUrl ?? ""),
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

export const api = {
  getApps: async (user_id?: string | null) =>
    normalizeAppsResponse(
      await getJson<unknown>(withQuery(`${BASE}/get_apps_99dj348`, { user_id })),
    ),

  detectKey: (api_key: string, user_id?: string | null) =>
    postJson<{
      provider?: string;
      detectedProvider?: string;
      message?: string;
      valid?: boolean;
      success?: boolean;
      error?: string;
    }>(`${BASE}/detect_apikey`, withUserId({ api_key }, user_id)),

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

// Normalize convo response into ConvoMessage[]
// New shape: [{ messages: [{ human: string, ai: string }, ...] }]
// Falls back to older shapes (array of {role, content}, etc.)
export function normalizeConvo(data: unknown): ConvoMessage[] {
  if (!data) return [];

  // New shape: array whose first item has .messages with {human, ai} pairs
  if (Array.isArray(data) && data.length > 0 && data[0] && typeof data[0] === "object") {
    const first = data[0] as any;
    if (Array.isArray(first.messages) && first.messages.length > 0 && ("human" in first.messages[0] || "ai" in first.messages[0])) {
      const out: ConvoMessage[] = [];
      for (const m of first.messages) {
        if (m?.human) {
          const raw = String(m.human);
          out.push({ role: "human", content: extractUserMessage(raw), raw });
        }
        if (m?.ai) {
          const raw = String(m.ai);
          out.push({ role: "ai", content: raw, raw });
        }
      }
      return out;
    }
  }

  let arr: any[] = [];
  if (Array.isArray(data)) arr = data;
  else if (typeof data === "object" && data !== null) {
    const d = data as any;
    arr = d.messages ?? d.conversation ?? d.data ?? [];
  }
  return arr
    .map((m): ConvoMessage | null => {
      if (!m) return null;
      const role = (m.role ?? m.type ?? (m.human ? "human" : "ai")) as string;
      const content = m.content ?? m.text ?? m.message ?? m.output ?? "";
      const isHuman = /human|user/i.test(role);
      return {
        role: isHuman ? "human" : "ai",
        content: isHuman ? extractUserMessage(String(content)) : String(content),
        raw: String(content),
      };
    })
    .filter(Boolean) as ConvoMessage[];
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

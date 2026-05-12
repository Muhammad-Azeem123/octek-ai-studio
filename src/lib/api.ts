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

export const api = {
  getApps: () => postJson<AppItem[]>(`${BASE}/get_apps_99dj348`, {}),

  detectKey: (api_key: string) =>
    postJson<{ provider?: string; valid?: boolean; success?: boolean; error?: string }>(
      `${BASE}/detect_key`,
      { api_key },
    ),

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

  createRepo: (payload: { name: string; mode: string; width: string; height: string }) =>
    postJson<{ app_id?: string; success?: boolean }>(`${BASE}/create_repo_99dj348`, payload),
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
export function normalizeConvo(data: unknown): ConvoMessage[] {
  if (!data) return [];
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

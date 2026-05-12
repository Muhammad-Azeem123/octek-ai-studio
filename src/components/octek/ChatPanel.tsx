import { useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Sparkles,
  X,
  Loader2,
  FileText,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { api, fileToBase64, normalizeConvo, type AppItem, type ConvoMessage } from "@/lib/api";
import { useToast } from "./ToastProvider";
import { LockedOverlay } from "./LockedOverlay";

const FRAMEWORKS = [
  { value: "claude-code", label: "claude-code" },
  { value: "continue", label: "continue" },
];

const MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "sonnet-4-6",
  "GPT-5.5",
  "GPT-4.1",
  "Claude Opus 4.7",
  "gemini-3.1-flash-lite-preview",
];

interface Props {
  app: AppItem | null;
  verifiedKey: string | null;
  onAfterSend: () => void;
  locked?: boolean;
  promptCount?: number;
  promptLimit?: number;
  userVerified?: boolean;
  onVerifyClick?: () => void;
}

interface AttachmentDraft {
  id: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export function ChatPanel({
  app,
  verifiedKey,
  onAfterSend,
  locked = false,
  promptCount = 0,
  promptLimit = 2,
  userVerified = false,
  onVerifyClick,
}: Props) {
  const [framework, setFramework] = useState(FRAMEWORKS[0].value);
  const [model, setModel] = useState(MODELS[0]);
  const [messages, setMessages] = useState<ConvoMessage[]>([]);
  const [loadingConvo, setLoadingConvo] = useState(false);
  const [input, setInput] = useState("");
  const [planning, setPlanning] = useState(false);
  const [sending, setSending] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Load convo when app changes
  useEffect(() => {
    if (!app) {
      setMessages([]);
      return;
    }
    setLoadingConvo(true);
    api
      .getConvo(app.app_id)
      .then((d) => setMessages(normalizeConvo(d)))
      .catch((e) => toast.push({ kind: "error", title: "Failed to load chat", message: e?.message }))
      .finally(() => setLoadingConvo(false));
  }, [app?.app_id]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Auto resize textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 180) + "px";
  }, [input]);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  async function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const drafts: AttachmentDraft[] = arr.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: "uploading",
    }));
    setAttachments((a) => [...a, ...drafts]);

    try {
      const payload = await Promise.all(
        arr.map(async (f) => ({
          filename: f.name,
          media_type: f.type || "application/octet-stream",
          base64: await fileToBase64(f),
        })),
      );
      await api.uploadFiles(payload);
      setAttachments((a) =>
        a.map((x) => (drafts.find((d) => d.id === x.id) ? { ...x, status: "done" } : x)),
      );
      toast.push({ kind: "success", title: `Uploaded ${arr.length} file(s)` });
    } catch (e: any) {
      setAttachments((a) =>
        a.map((x) =>
          drafts.find((d) => d.id === x.id) ? { ...x, status: "error", error: e?.message } : x,
        ),
      );
      toast.push({ kind: "error", title: "Upload failed", message: e?.message });
    }
  }

  async function send() {
    if (!app) {
      toast.push({ kind: "warning", title: "Select an app first" });
      return;
    }
    if (!verifiedKey) {
      toast.push({ kind: "warning", title: "Verify an API key first" });
      return;
    }
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "human", content: text }]);
    setInput("");
    setSending(true);

    try {
      const res = await api.runAgent({
        input: text,
        app_id: app.app_id,
        planning: planning ? "true" : "false",
        mode: app.app_mode,
        model,
        agent_framework: framework,
        environment: "dev",
        api_key: verifiedKey,
      });
      const aiText =
        (typeof res === "string" ? res : res?.output ?? res?.response ?? res?.message) ||
        "Done.";
      setMessages((m) => [...m, { role: "ai", content: String(aiText) }]);
      onAfterSend();
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "ai", content: `**Error:** ${e?.message ?? "Request failed"}` },
      ]);
      toast.push({ kind: "error", title: "Agent error", message: e?.message });
    } finally {
      setSending(false);
    }
  }

  return (
    <aside
      className="flex flex-col bg-[var(--bg-secondary)] border-l border-[var(--border)] shrink-0"
      style={{ width: "var(--chat-width)" }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center gap-2">
        <MessageSquare size={16} className="text-[var(--accent)]" />
        <div className="font-semibold text-sm truncate">{app?.name ?? "No app selected"}</div>
      </div>

      {/* Dropdowns */}
      <div className="px-3 py-2.5 border-b border-[var(--border)] grid grid-cols-2 gap-2">
        <Select value={framework} onChange={setFramework} options={FRAMEWORKS.map((f) => ({ value: f.value, label: f.label }))} />
        <Select value={model} onChange={setModel} options={MODELS.map((m) => ({ value: m, label: m }))} />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-3">
        {loadingConvo && (
          <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {!loadingConvo && messages.length === 0 && !sending && (
          <div className="h-full grid place-items-center text-center pt-12">
            <div>
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] grid place-items-center mx-auto mb-3 text-[var(--accent)]">
                <Sparkles size={22} />
              </div>
              <div className="text-sm text-[var(--text-secondary)]">Describe what you want to build</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">
                The agent will modify your app live
              </div>
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex animate-fade-up ${m.role === "human" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[88%] rounded-[var(--radius)] px-3.5 py-2.5 text-[13px] leading-relaxed ${
                m.role === "human"
                  ? "bg-[var(--chat-human)] text-[var(--text-primary)] rounded-tr-sm"
                  : "bg-[var(--chat-ai)] border border-[var(--border)] text-[var(--text-primary)] rounded-tl-sm markdown-body"
              }`}
            >
              {m.role === "ai" ? <ReactMarkdown>{m.content}</ReactMarkdown> : m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start animate-fade-up">
            <div className="bg-[var(--chat-ai)] border border-[var(--border)] rounded-[var(--radius)] rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] thinking-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] thinking-dot" style={{ animationDelay: "0.15s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] thinking-dot" style={{ animationDelay: "0.3s" }} />
              </div>
              <span className="text-xs text-[var(--text-secondary)]">Agent is working…</span>
            </div>
          </div>
        )}
      </div>

      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="px-3 pt-2 flex flex-wrap gap-1.5 border-t border-[var(--border)]">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md pl-2 pr-1 py-1 text-[11px]"
            >
              {a.file.type.startsWith("image/") ? (
                <ImageIcon size={11} className="text-[var(--accent)]" />
              ) : (
                <FileText size={11} className="text-[var(--text-secondary)]" />
              )}
              <span className="max-w-[140px] truncate">{a.file.name}</span>
              {a.status === "uploading" && <Loader2 size={10} className="animate-spin" />}
              {a.status === "error" && <span className="text-[var(--danger)]">!</span>}
              <button
                onClick={() => setAttachments((arr) => arr.filter((x) => x.id !== a.id))}
                className="ml-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-[var(--border)]">
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] focus-within:border-[var(--accent)]/60 rounded-[var(--radius)] transition-colors">
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Describe what you want to build…"
            rows={1}
            className="w-full bg-transparent resize-none outline-none px-3 py-2.5 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] scrollbar-thin"
          />
          <div className="flex items-center gap-1 px-2 pb-2">
            <label className="w-7 h-7 grid place-items-center rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer">
              <Paperclip size={14} />
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.csv,.json,.txt,.md"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </label>
            <button
              onClick={() => setPlanning((p) => !p)}
              title="Planning mode"
              className={`h-7 px-2 rounded-md text-[11px] font-mono flex items-center gap-1 transition-colors ${
                planning
                  ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/40"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              }`}
            >
              <Sparkles size={11} />
              plan
            </button>
            <div className="flex-1" />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="h-8 px-3 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-40 disabled:cursor-not-allowed text-[#06140f] flex items-center gap-1.5 transition-colors"
            >
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-[var(--bg-tertiary)] border border-[var(--border)] hover:border-[var(--border-hover)] focus:border-[var(--accent)] rounded-md text-[11px] font-mono text-[var(--text-primary)] px-2.5 py-1.5 pr-6 outline-none transition-colors cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[var(--bg-secondary)]">
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]">
        ▾
      </span>
    </div>
  );
}

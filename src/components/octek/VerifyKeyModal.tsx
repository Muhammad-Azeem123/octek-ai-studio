import { useEffect, useState } from "react";
import { X, Loader2, ShieldCheck, Eye, EyeOff, Key } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";

interface Props {
  open: boolean;
<<<<<<< HEAD
  userId?: string | null;
=======
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
  onClose: () => void;
  onVerified: (key: string, provider: string) => void;
}

<<<<<<< HEAD
export function VerifyKeyModal({ open, userId, onClose, onVerified }: Props) {
=======
export function VerifyKeyModal({ open, onClose, onVerified }: Props) {
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
  const [key, setKey] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setKey("");
      setShow(false);
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      toast.push({ kind: "warning", title: "Enter your API key" });
      return;
    }
    setLoading(true);
    try {
<<<<<<< HEAD
      const res = await api.detectKey(trimmed, userId);
=======
      const res = await api.detectKey(trimmed);
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
      const detected = res.detectedProvider ?? res.provider;
      const ok = (res.valid !== false && res.success !== false && !res.error) || !!detected;
      if (!ok) {
        toast.push({ kind: "error", title: "Verification failed", message: res.error ?? "Invalid key" });
        return;
      }
      const provider = detected ?? "Verified";
      toast.push({
        kind: "success",
        title: "API key verified",
        message: res.message ?? `${provider} • unlimited access unlocked`,
      });
      onVerified(trimmed, provider);
      onClose();
    } catch (e: any) {
      toast.push({ kind: "error", title: "Verification error", message: e?.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 backdrop-blur-md animate-fade-up">
      <form
        onSubmit={submit}
        className="relative bg-[var(--bg-card)] border border-[var(--accent)]/40 rounded-2xl w-[480px] max-w-[92vw] p-6 shadow-2xl animate-scale-in glow-accent"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 grid place-items-center rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
        >
          <X size={14} />
        </button>

        <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] grid place-items-center mb-4">
          <ShieldCheck size={22} />
        </div>
        <h2 className="text-lg font-bold tracking-tight">Verify your API key</h2>
        <p className="text-[13px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
          Bring your own provider key to unlock unlimited apps and prompts. We detect the provider
          automatically — Gemini, OpenAI, or Anthropic.
        </p>

        <div className="mt-5">
          <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-semibold">
            API Key
          </div>
          <div className="relative">
            <Key
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
            />
            <input
              autoFocus
              type={show ? "text" : "password"}
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AIza… / sk-… / sk-ant-…"
              className="w-full h-10 pl-9 pr-10 rounded-md bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-[13px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-snug">
            Your key is sent securely to our verification endpoint and never stored in the browser
            beyond this session.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-[#06140f] text-sm font-bold flex items-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Verify & Unlock
          </button>
        </div>
      </form>
    </div>
  );
}

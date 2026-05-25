import { useEffect, useState } from "react";
import { X, Loader2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "./ToastProvider";

const MODES = [
  { value: "html", label: "HTML" },
  { value: "gsap_v1", label: "GSAP Animation v1" },
  { value: "gsap_v2", label: "GSAP Animation v2" },
];

interface Props {
  open: boolean;
<<<<<<< HEAD
  userId?: string | null;
=======
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
  onClose: () => void;
  onCreated: (appId?: string) => void;
}

<<<<<<< HEAD
export function NewAppModal({ open, userId, onClose, onCreated }: Props) {
=======
export function NewAppModal({ open, onClose, onCreated }: Props) {
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
  const [name, setName] = useState("");
  const [mode, setMode] = useState("html");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (open) {
      setName("");
      setMode("html");
      setWidth("");
      setHeight("");
    }
  }, [open]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.push({ kind: "warning", title: "App name is required" });
      return;
    }
    setSubmitting(true);
    try {
<<<<<<< HEAD
      const res = await api.createRepo({ user_id: userId, name: name.trim(), mode, width, height });
=======
      const res = await api.createRepo({ name: name.trim(), mode, width, height });
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
      toast.push({ kind: "success", title: "App created" });
      onCreated(res?.app_id);
      onClose();
    } catch (e: any) {
      toast.push({ kind: "error", title: "Create failed", message: e?.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 backdrop-blur-sm animate-fade-up">
      <form
        onSubmit={submit}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-[440px] max-w-[92vw] p-5 shadow-2xl animate-scale-in"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] grid place-items-center">
            <Plus size={16} />
          </div>
          <div className="font-semibold">Create New App</div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-7 h-7 grid place-items-center rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
          >
            <X size={14} />
          </button>
        </div>

        <Field label="App name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="My awesome app"
            className="input"
          />
        </Field>

        <Field label="Mode">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="input cursor-pointer">
            {MODES.map((m) => (
              <option key={m.value} value={m.value} className="bg-[var(--bg-secondary)]">
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-semibold">
                Width
              </div>
              <input
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="e.g. 1920"
                className="input font-mono"
                aria-label="Width"
              />
            </div>
            <div>
              <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-semibold">
                Height
              </div>
              <input
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 1080"
                className="input font-mono"
                aria-label="Height"
              />
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-snug">
            Set the canvas size for the app, or leave blank to make it responsive.
          </p>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-md bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-[#06140f] text-sm font-bold flex items-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Create App
          </button>
        </div>

        <style>{`
          .input {
            width: 100%;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 13px;
            outline: none;
            transition: border-color .15s;
          }
          .input:focus { border-color: var(--accent); }
        `}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-3">
      <div className="text-[11px] tracking-[0.12em] uppercase text-[var(--text-muted)] mb-1.5 font-semibold">
        {label}
      </div>
      {children}
    </label>
  );
}

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info" | "warning";
export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastCtx {
  push: (t: Omit<Toast, "id">) => void;
}
const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useToast outside provider");
  return c;
}

const ICONS: Record<ToastKind, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLORS: Record<ToastKind, string> = {
  success: "text-[var(--accent)] border-[var(--accent)]/40",
  error: "text-[var(--danger)] border-[var(--danger)]/40",
  info: "text-sky-400 border-sky-400/40",
  warning: "text-[var(--warning)] border-[var(--warning)]/40",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((arr) => [...arr, { ...t, id }]);
    setTimeout(() => setToasts((arr) => arr.filter((x) => x.id !== id)), 5000);
  }, []);

  const remove = (id: string) => setToasts((arr) => arr.filter((x) => x.id !== id));
  const value = useMemo(() => ({ push }), [push]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[340px] pointer-events-none">
        {toasts.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              className={`pointer-events-auto bg-[var(--bg-card)] border rounded-[var(--radius)] p-3 flex gap-3 items-start shadow-2xl animate-slide-in-right ${COLORS[t.kind]}`}
            >
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--text-primary)]">{t.title}</div>
                {t.message && (
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 break-words">
                    {t.message}
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
                aria-label="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

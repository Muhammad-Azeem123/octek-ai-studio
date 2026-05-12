import { Plus, FileText, Loader2 } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import type { AppItem } from "@/lib/api";

interface Props {
  apps: AppItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (a: AppItem) => void;
  onNewApp: () => void;
}

export function Sidebar({ apps, loading, selectedId, onSelect, onNewApp }: Props) {
  return (
    <aside
      className="flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] shrink-0"
      style={{ width: "var(--sidebar-width)" }}
    >
      <div className="px-[18px] pt-5 pb-3.5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <Logo size={28} />
          <div className="font-bold tracking-tight text-[15px]">OCTEK AI</div>
          <div className="ml-auto text-[10px] font-mono tracking-[0.15em] text-[var(--text-muted)]">
            BUILDER
          </div>
        </div>

        <button
          onClick={onNewApp}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-[#06140f] font-bold py-2.5 rounded-[var(--radius)] text-sm transition-colors glow-accent"
        >
          <Plus size={16} strokeWidth={3} />
          New App
        </button>
      </div>

      <div className="px-[18px] pt-4 pb-2 text-[10px] tracking-[0.15em] text-[var(--text-muted)] font-semibold">
        YOUR APPS
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
        {loading && (
          <div className="flex items-center justify-center py-8 text-[var(--text-muted)]">
            <Loader2 size={16} className="animate-spin" />
          </div>
        )}
        {!loading && apps.length === 0 && (
          <div className="px-3 py-6 text-xs text-[var(--text-muted)] text-center">
            No apps yet. Click + New App to start.
          </div>
        )}
        {apps.map((a) => {
          const active = a.app_id === selectedId;
          return (
            <button
              key={a.app_id}
              onClick={() => onSelect(a)}
              className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius)] mb-0.5 transition-all group ${
                active
                  ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30 glow-accent"
                  : "border border-transparent hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-hover)]"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                  active ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                }`}
              >
                <FileText size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate text-[var(--text-primary)]">
                  {a.name || "Untitled"}
                </div>
                <div className="text-[10px] font-mono tracking-wider text-[var(--text-muted)] uppercase truncate">
                  {a.app_mode || "html"}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

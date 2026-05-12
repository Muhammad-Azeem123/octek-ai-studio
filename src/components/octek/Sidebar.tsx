import { useState } from "react";
import { Plus, FileText, Loader2, Lock, Search, X } from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import type { AppItem } from "@/lib/api";

interface Props {
  apps: AppItem[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (a: AppItem) => void;
  onNewApp: () => void;
  canCreate: boolean;
  locked?: boolean;
}

export function Sidebar({ apps, loading, selectedId, onSelect, onNewApp, canCreate, locked }: Props) {
  const [query, setQuery] = useState("");
  const sortedApps = [...apps].sort((a, b) => {
    const ad = (a as any).createdAt ? new Date((a as any).createdAt).getTime() : (a as any).id ?? 0;
    const bd = (b as any).createdAt ? new Date((b as any).createdAt).getTime() : (b as any).id ?? 0;
    return bd - ad;
  });
  const q = query.trim().toLowerCase();
  const filteredApps = q
    ? sortedApps.filter((a) => (a.name || "").toLowerCase().includes(q))
    : sortedApps;
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
          disabled={!canCreate}
          title={canCreate ? "Create a new app" : "Verify your API key first"}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 disabled:cursor-not-allowed text-[#06140f] font-bold py-2.5 rounded-[var(--radius)] text-sm transition-colors glow-accent"
        >
          {canCreate ? <Plus size={16} strokeWidth={3} /> : <Lock size={14} strokeWidth={3} />}
          New App
        </button>
        {!canCreate && (
          <p className="mt-2 text-[10px] text-[var(--text-muted)] leading-snug text-center">
            Verify your API key to create new apps
          </p>
        )}
      </div>

      <div className="px-[18px] pt-4 pb-2 flex items-center justify-between">
        <span className="text-[10px] tracking-[0.15em] text-[var(--text-muted)] font-semibold">
          YOUR APPS
        </span>
        <span className="text-[10px] text-[var(--text-muted)] font-mono">
          {filteredApps.length}/{apps.length}
        </span>
      </div>

      <div className="px-[18px] pb-2">
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps…"
            className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none rounded-md text-[12px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] pl-7 pr-7 py-1.5 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              title="Clear search"
              aria-label="Clear search"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 grid place-items-center rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            >
              <X size={11} />
            </button>
          )}
        </div>
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="mt-1.5 w-full text-[10px] text-[var(--accent)] hover:underline text-left px-0.5"
          >
            Clear search
          </button>
        )}
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
        {!loading && apps.length > 0 && filteredApps.length === 0 && (
          <div className="px-3 py-6 text-xs text-[var(--text-muted)] text-center">
            No apps match "{query}".
          </div>
        )}
        {filteredApps.map((a) => {
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
      <div className="px-[18px] py-3 border-t border-[var(--border)] flex items-center justify-between">
        <span className="text-[10px] tracking-[0.15em] text-[var(--text-muted)] font-semibold uppercase">
          Theme
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}

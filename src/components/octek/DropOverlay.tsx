import { Upload } from "lucide-react";

export function DropOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-[90] pointer-events-none grid place-items-center">
      <div className="absolute inset-4 border-2 border-dashed border-[var(--accent)] rounded-2xl bg-[var(--accent-glow)] backdrop-blur-sm" />
      <div className="relative text-center">
        <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--accent)] grid place-items-center mx-auto mb-3 text-[var(--accent)]">
          <Upload size={26} />
        </div>
        <div className="text-lg font-semibold text-[var(--text-primary)]">Drop files to attach</div>
        <div className="text-xs text-[var(--text-secondary)] mt-1">
          Images, PDF, CSV, JSON, TXT, MD
        </div>
      </div>
    </div>
  );
}

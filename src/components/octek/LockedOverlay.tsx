import { Lock, ShieldCheck, ArrowRight } from "lucide-react";

interface Props {
  onVerify: () => void;
  variant?: "full" | "compact";
}

export function LockedOverlay({ onVerify, variant = "full" }: Props) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center pointer-events-none">
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent backdrop-blur-[3px]" />
      <div
        className={`relative pointer-events-auto m-4 ${
          variant === "compact" ? "max-w-[340px]" : "max-w-[420px]"
        } w-[calc(100%-32px)] bg-[var(--bg-card)] border border-[var(--accent)]/40 rounded-xl p-5 shadow-2xl glow-accent animate-fade-up`}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 text-[var(--accent)] grid place-items-center">
            <Lock size={16} />
          </div>
          <div>
            <div className="font-semibold text-sm">Free demo limit reached</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              You've used your 2 free prompts.
            </div>
          </div>
        </div>
        <p className="text-[12.5px] text-[var(--text-secondary)] leading-relaxed mb-4">
          Verify your own API key to continue building unlimited apps with no restrictions.
        </p>
        <button
          onClick={onVerify}
          className="w-full flex items-center justify-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-dim)] text-[#06140f] font-bold text-sm py-2.5 rounded-md glow-accent transition-colors"
        >
          <ShieldCheck size={14} />
          Verify API Key
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}

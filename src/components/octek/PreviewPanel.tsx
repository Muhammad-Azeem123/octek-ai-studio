import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Github, ExternalLink, RefreshCw, Monitor, Loader2, Lock, ShieldCheck } from "lucide-react";
import { api, cacheBust, previewUrl } from "@/lib/api";
import { useToast } from "./ToastProvider";
import type { AppItem } from "@/lib/api";

interface Props {
  app: AppItem | null;
  apiKey: string;
  setApiKey: (k: string) => void;
  verifiedKey: string | null;
  setVerifiedKey: (k: string | null) => void;
  provider: string | null;
  setProvider: (p: string | null) => void;
  reloadToken: number;
  locked?: boolean;
  userVerified?: boolean;
  onVerifyClick?: () => void;
}

export function PreviewPanel({
  app,
  apiKey,
  setApiKey,
  verifiedKey,
  setVerifiedKey,
  provider,
  setProvider,
  reloadToken,
  locked = false,
  userVerified = false,
  onVerifyClick,
}: Props) {
  const [show, setShow] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyState, setVerifyState] = useState<"idle" | "ok" | "fail">("idle");
  const [iframeSrc, setIframeSrc] = useState<string>("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const toast = useToast();

  const baseUrl = app ? previewUrl(app.app_id) : "";

  useEffect(() => {
    if (app) setIframeSrc(cacheBust(previewUrl(app.app_id)));
    else setIframeSrc("");
  }, [app?.app_id, reloadToken]);

  async function verify() {
    if (!apiKey.trim()) {
      toast.push({ kind: "warning", title: "Enter an API key first" });
      return;
    }
    setVerifying(true);
    setVerifyState("idle");
    try {
      const res = await api.detectKey(apiKey.trim());
      const detected = res.detectedProvider ?? res.provider;
      const ok = (res.valid !== false && res.success !== false && !res.error) || !!detected;
      if (ok) {
        setVerifyState("ok");
        setVerifiedKey(apiKey.trim());
        setProvider(detected ?? "Verified");
        toast.push({ kind: "success", title: "API key verified", message: detected });
      } else {
        setVerifyState("fail");
        setVerifiedKey(null);
        setProvider(null);
        toast.push({ kind: "error", title: "Verification failed", message: res.error });
      }
    } catch (e: any) {
      setVerifyState("fail");
      setVerifiedKey(null);
      setProvider(null);
      toast.push({ kind: "error", title: "Verification error", message: e?.message });
    } finally {
      setVerifying(false);
    }
  }

  function refresh() {
    if (app) setIframeSrc(cacheBust(previewUrl(app.app_id)));
  }

  return (
    <section className="flex-1 min-w-0 flex flex-col bg-[var(--bg-primary)]">
      {/* API KEY BAR */}
      <div className="h-11 flex items-center gap-2 px-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <span className="text-[10px] tracking-[0.18em] font-semibold text-[var(--text-muted)] shrink-0">
          API KEY
        </span>
        <div className="flex-1 relative">
          <input
            type={show ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Paste your provider API key"
            className="w-full h-7 px-3 pr-8 rounded-[var(--radius)] bg-[var(--bg-tertiary)] border border-[var(--border)] focus:border-[var(--accent)] outline-none text-xs font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
          />
          <button
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            aria-label="Toggle visibility"
          >
            {show ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <button
          onClick={verify}
          disabled={verifying}
          className="h-7 px-3 rounded-[var(--radius)] bg-[var(--accent)] hover:bg-[var(--accent-dim)] disabled:opacity-50 text-[#06140f] text-xs font-bold flex items-center gap-1.5 transition-colors"
        >
          {verifying && <Loader2 size={12} className="animate-spin" />}
          Verify
        </button>
        {verifyState !== "idle" && (
          <div className="flex items-center gap-1.5 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                verifyState === "ok" ? "bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" : "bg-[var(--danger)]"
              }`}
            />
            <span className="text-[var(--text-secondary)]">
              {verifyState === "ok" ? provider ?? "Verified" : "Failed"}
            </span>
          </div>
        )}
      </div>

      {/* URL BAR */}
      <div className="h-11 flex items-center gap-2 px-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        {app ? (
          <>
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)] shrink-0" />
            <div className="flex-1 min-w-0 font-mono text-[11px] text-[var(--text-secondary)] truncate">
              {baseUrl}
            </div>
            {app.repo_url && (
              <a
                href={app.repo_url}
                target="_blank"
                rel="noreferrer"
                className="w-7 h-7 grid place-items-center rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Open repo"
              >
                <Github size={14} />
              </a>
            )}
            <a
              href={baseUrl}
              target="_blank"
              rel="noreferrer"
              className="w-7 h-7 grid place-items-center rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Open preview"
            >
              <ExternalLink size={14} />
            </a>
            <button
              onClick={refresh}
              className="w-7 h-7 grid place-items-center rounded-md hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </>
        ) : (
          <div className="text-[11px] text-[var(--text-muted)] font-mono">
            Select or create an app to see the preview URL
          </div>
        )}
      </div>

      {/* PREVIEW */}
      <div className="flex-1 min-h-0 bg-white">
        {app ? (
          <iframe
            ref={iframeRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            title={app.name}
          />
        ) : (
          <div className="w-full h-full bg-[var(--bg-primary)] grid place-items-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)] grid place-items-center mx-auto mb-4 text-[var(--text-muted)]">
                <Monitor size={28} />
              </div>
              <div className="text-[var(--text-secondary)] text-sm">
                Your live preview will appear here
              </div>
              <div className="text-[var(--text-muted)] text-xs mt-1">
                Pick an app from the sidebar or create a new one
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

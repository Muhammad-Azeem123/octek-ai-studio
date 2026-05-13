import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/octek/Sidebar";
import { PreviewPanel } from "@/components/octek/PreviewPanel";
import { ChatPanel } from "@/components/octek/ChatPanel";
import { NewAppModal } from "@/components/octek/NewAppModal";
import { DropOverlay } from "@/components/octek/DropOverlay";
import { VerifyKeyModal } from "@/components/octek/VerifyKeyModal";
import { ToastProvider, useToast } from "@/components/octek/ToastProvider";
import { api, fileToBase64, type AppItem } from "@/lib/api";
import { isAuthenticated, logout as doLogout } from "@/lib/auth";

const DEMO_API_KEY = "AIzaSyA_wVvnlQiPMK2pBwVaEAuKmbxrHvcWDg8";
const DEMO_PROVIDER = "Google Gemini (demo)";
const FREE_PROMPT_LIMIT = 2;
const LS_PROMPT_COUNT = "octek-prompt-count";
const LS_USER_KEY = "octek-user-verified-key";
const LS_USER_PROVIDER = "octek-user-verified-provider";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OCTEK AI Builder" },
      { name: "description", content: "Build AI-powered web apps live with the OCTEK AI Builder." },
    ],
  }),
  component: () => (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  ),
});

function Dashboard() {
  const toast = useToast();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selected, setSelected] = useState<AppItem | null>(null);

  // Pre-filled demo state
  const [apiKey, setApiKey] = useState(DEMO_API_KEY);
  const [verifiedKey, setVerifiedKey] = useState<string | null>(DEMO_API_KEY);
  const [provider, setProvider] = useState<string | null>(DEMO_PROVIDER);

  // User-supplied verified key (persists; unlocks unlimited)
  const [userVerifiedKey, setUserVerifiedKey] = useState<string | null>(null);
  const [promptCount, setPromptCount] = useState(0);

  const [reloadToken, setReloadToken] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Hydrate persisted state
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem(LS_USER_KEY);
      const savedProv = localStorage.getItem(LS_USER_PROVIDER);
      const savedCount = parseInt(localStorage.getItem(LS_PROMPT_COUNT) ?? "0", 10);
      if (savedKey) {
        setUserVerifiedKey(savedKey);
        setApiKey(savedKey);
        setVerifiedKey(savedKey);
        setProvider(savedProv ?? "Verified");
      }
      if (!Number.isNaN(savedCount)) setPromptCount(savedCount);
    } catch {}
  }, []);

  const locked = !userVerifiedKey && promptCount >= FREE_PROMPT_LIMIT;

  const loadApps = useCallback(
    async (autoSelectId?: string) => {
      setLoadingApps(true);
      try {
        const res = await api.getApps();
        const list = Array.isArray(res) ? res : [];
        setApps(list);
        if (autoSelectId) {
          const found = list.find((a) => a.app_id === autoSelectId);
          if (found) setSelected(found);
        }
      } catch (e: any) {
        toast.push({ kind: "error", title: "Failed to load apps", message: e?.message });
      } finally {
        setLoadingApps(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Global drag & drop (disabled when locked)
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      if (locked) return;
      if (!e.dataTransfer?.types?.includes("Files")) return;
      dragCounter.current++;
      setDragOver(true);
    };
    const onDragLeave = () => {
      dragCounter.current--;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setDragOver(false);
      }
    };
    const onDragOver = (e: DragEvent) => e.preventDefault();
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragOver(false);
      if (locked) return;
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;
      try {
        const payload = await Promise.all(
          Array.from(files).map(async (f) => ({
            filename: f.name,
            media_type: f.type || "application/octet-stream",
            base64: await fileToBase64(f),
          })),
        );
        await api.uploadFiles(payload);
        toast.push({ kind: "success", title: `Uploaded ${files.length} file(s)` });
      } catch (err: any) {
        toast.push({ kind: "error", title: "Upload failed", message: err?.message });
      }
    };
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [toast, locked]);

  const handlePromptSent = useCallback(() => {
    if (userVerifiedKey) return; // unlimited
    setPromptCount((c) => {
      const next = c + 1;
      try {
        localStorage.setItem(LS_PROMPT_COUNT, String(next));
      } catch {}
      return next;
    });
  }, [userVerifiedKey]);

  const handleUserVerified = useCallback(
    (key: string, prov: string) => {
      setUserVerifiedKey(key);
      setApiKey(key);
      setVerifiedKey(key);
      setProvider(prov);
      try {
        localStorage.setItem(LS_USER_KEY, key);
        localStorage.setItem(LS_USER_PROVIDER, prov);
      } catch {}
    },
    [],
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        apps={apps}
        loading={loadingApps}
        selectedId={selected?.app_id ?? null}
        onSelect={setSelected}
        onNewApp={() => {
          if (locked) {
            setVerifyOpen(true);
            return;
          }
          setModalOpen(true);
        }}
        canCreate={!locked}
        locked={locked}
      />
      <PreviewPanel
        app={selected}
        apiKey={apiKey}
        setApiKey={setApiKey}
        verifiedKey={verifiedKey}
        setVerifiedKey={(k) => {
          setVerifiedKey(k);
          if (k && k !== DEMO_API_KEY) {
            // Treat manual verification via the inline bar as user-verified too
            setUserVerifiedKey(k);
            try {
              localStorage.setItem(LS_USER_KEY, k);
            } catch {}
          }
        }}
        provider={provider}
        setProvider={(p) => {
          setProvider(p);
          if (p && userVerifiedKey) {
            try {
              localStorage.setItem(LS_USER_PROVIDER, p);
            } catch {}
          }
        }}
        reloadToken={reloadToken}
      />
      <ChatPanel
        app={selected}
        verifiedKey={verifiedKey}
        onAfterSend={() => {
          setReloadToken((t) => t + 1);
          handlePromptSent();
        }}
        locked={locked}
        promptCount={promptCount}
        promptLimit={FREE_PROMPT_LIMIT}
        userVerified={!!userVerifiedKey}
        onVerifyClick={() => setVerifyOpen(true)}
      />

      <NewAppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => loadApps(id)}
      />
      <VerifyKeyModal
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        onVerified={handleUserVerified}
      />
      <DropOverlay visible={dragOver} />
    </div>
  );
}

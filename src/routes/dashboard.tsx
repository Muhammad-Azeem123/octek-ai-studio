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
<<<<<<< HEAD
import {
  FREE_PROMPT_LIMIT,
  FREE_TRIAL_DEMO_API_KEY,
  getUserVerifiedProvider,
  incrementPromptCount,
  isOwnVerifiedApiKey,
  loadTrialState,
  setUserVerifiedKey as persistUserVerifiedKey,
} from "@/lib/freeTrial";
import { getCurrentUserId, isLoggedIn, logoutUser } from "../services/authService";

const DEMO_API_KEY = FREE_TRIAL_DEMO_API_KEY;
const DEMO_PROVIDER = "Google Gemini (demo)";
=======
import { isAuthenticated, logout as doLogout } from "@/lib/auth";

const DEMO_API_KEY = "AIzaSyA_wVvnlQiPMK2pBwVaEAuKmbxrHvcWDg8";
const DEMO_PROVIDER = "Google Gemini (demo)";
const FREE_PROMPT_LIMIT = 2;
const LS_PROMPT_COUNT = "octek-prompt-count";
const LS_USER_KEY = "octek-user-verified-key";
const LS_USER_PROVIDER = "octek-user-verified-provider";
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — OCTEK AI Builder" },
      { name: "description", content: "Build AI-powered web apps live with the OCTEK AI Builder." },
    ],
  }),
  beforeLoad: () => {
<<<<<<< HEAD
    if (typeof window !== "undefined" && !isLoggedIn()) {
=======
    if (typeof window !== "undefined" && !isAuthenticated()) {
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
      throw redirect({ to: "/login" });
    }
  },
  component: () => (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  ),
});

function Dashboard() {
  const toast = useToast();
  const navigate = useNavigate();
<<<<<<< HEAD
  const userId = typeof window !== "undefined" ? getCurrentUserId() : null;
  const initialTrial =
    typeof window !== "undefined" ? loadTrialState(getCurrentUserId()) : { ownVerifiedKey: null, promptCount: 0 };

  useEffect(() => {
    if (!isLoggedIn()) window.location.href = "/login";
  }, []);

  const handleLogout = useCallback(() => {
    logoutUser();
  }, []);
=======

  const handleLogout = useCallback(() => {
    doLogout();
    navigate({ to: "/login" });
  }, [navigate]);
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
  const handleBackHome = useCallback(() => {
    navigate({ to: "/" });
  }, [navigate]);

  const [apps, setApps] = useState<AppItem[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [selected, setSelected] = useState<AppItem | null>(null);

  // Pre-filled demo state
  const [apiKey, setApiKey] = useState(DEMO_API_KEY);
  const [verifiedKey, setVerifiedKey] = useState<string | null>(DEMO_API_KEY);
  const [provider, setProvider] = useState<string | null>(DEMO_PROVIDER);

<<<<<<< HEAD
  // User's own verified key (not the shared demo key)
  const [userVerifiedKey, setUserVerifiedKey] = useState<string | null>(initialTrial.ownVerifiedKey);
  const [promptCount, setPromptCount] = useState(initialTrial.promptCount);
=======
  // User-supplied verified key (persists; unlocks unlimited)
  const [userVerifiedKey, setUserVerifiedKey] = useState<string | null>(null);
  const [promptCount, setPromptCount] = useState(0);
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e

  const [reloadToken, setReloadToken] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

<<<<<<< HEAD
  // Re-sync if userId becomes available after mount (e.g. client navigation)
  useEffect(() => {
    if (!userId) return;
    const { ownVerifiedKey, promptCount: savedCount } = loadTrialState(userId);
    if (ownVerifiedKey) {
      const savedProv = getUserVerifiedProvider(userId);
      setUserVerifiedKey(ownVerifiedKey);
      setApiKey(ownVerifiedKey);
      setVerifiedKey(ownVerifiedKey);
      setProvider(savedProv ?? "Verified");
    } else {
      setUserVerifiedKey(null);
      setApiKey(DEMO_API_KEY);
      setVerifiedKey(DEMO_API_KEY);
      setProvider(DEMO_PROVIDER);
    }
    setPromptCount(savedCount);
  }, [userId]);
=======
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
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e

  const locked = !userVerifiedKey && promptCount >= FREE_PROMPT_LIMIT;

  const loadApps = useCallback(
    async (autoSelectId?: string) => {
      setLoadingApps(true);
      try {
<<<<<<< HEAD
        const res = await api.getApps(userId);
=======
        const res = await api.getApps();
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
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
<<<<<<< HEAD
    [toast, userId],
=======
    [toast],
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
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
<<<<<<< HEAD
    if (!userId || userVerifiedKey) return;
    const next = incrementPromptCount(userId);
    setPromptCount(next);
  }, [userId, userVerifiedKey]);

  const handleUserVerified = useCallback(
    (key: string, prov: string) => {
      if (!userId || !isOwnVerifiedApiKey(key)) return;
=======
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
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
      setUserVerifiedKey(key);
      setApiKey(key);
      setVerifiedKey(key);
      setProvider(prov);
<<<<<<< HEAD
      persistUserVerifiedKey(userId, key, prov);
    },
    [userId],
=======
      try {
        localStorage.setItem(LS_USER_KEY, key);
        localStorage.setItem(LS_USER_PROVIDER, prov);
      } catch {}
    },
    [],
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
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
        onBackHome={handleBackHome}
        onLogout={handleLogout}
      />
      <PreviewPanel
        app={selected}
<<<<<<< HEAD
        userId={userId}
=======
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
        apiKey={apiKey}
        setApiKey={setApiKey}
        verifiedKey={verifiedKey}
        locked={locked}
        userVerified={!!userVerifiedKey}
        onVerifyClick={() => setVerifyOpen(true)}
        setVerifiedKey={(k) => {
          setVerifiedKey(k);
<<<<<<< HEAD
          if (k && isOwnVerifiedApiKey(k) && userId) {
            setUserVerifiedKey(k);
            persistUserVerifiedKey(userId, k, provider ?? "Verified");
=======
          if (k && k !== DEMO_API_KEY) {
            // Treat manual verification via the inline bar as user-verified too
            setUserVerifiedKey(k);
            try {
              localStorage.setItem(LS_USER_KEY, k);
            } catch {}
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
          }
        }}
        provider={provider}
        setProvider={(p) => {
          setProvider(p);
<<<<<<< HEAD
          if (p && userVerifiedKey && userId) {
            persistUserVerifiedKey(userId, userVerifiedKey, p);
=======
          if (p && userVerifiedKey) {
            try {
              localStorage.setItem(LS_USER_PROVIDER, p);
            } catch {}
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
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
<<<<<<< HEAD
        userId={userId}
=======
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
        onClose={() => setModalOpen(false)}
        onCreated={(id) => loadApps(id)}
      />
      <VerifyKeyModal
        open={verifyOpen}
<<<<<<< HEAD
        userId={userId}
=======
>>>>>>> 35fb837ca2af6a571858b394bd3705b6cf78063e
        onClose={() => setVerifyOpen(false)}
        onVerified={handleUserVerified}
      />
      <DropOverlay visible={dragOver} />
    </div>
  );
}

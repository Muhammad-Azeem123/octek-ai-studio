import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Sidebar } from "@/components/octek/Sidebar";
import { PreviewPanel } from "@/components/octek/PreviewPanel";
import { ChatPanel } from "@/components/octek/ChatPanel";
import { NewAppModal } from "@/components/octek/NewAppModal";
import { DropOverlay } from "@/components/octek/DropOverlay";
import { ToastProvider, useToast } from "@/components/octek/ToastProvider";
import { api, fileToBase64, type AppItem } from "@/lib/api";

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
  const [apiKey, setApiKey] = useState("");
  const [verifiedKey, setVerifiedKey] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounter = useRef(0);

  const loadApps = useCallback(async (autoSelectId?: string) => {
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
  }, [toast]);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Global drag & drop
  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
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
  }, [toast]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        apps={apps}
        loading={loadingApps}
        selectedId={selected?.app_id ?? null}
        onSelect={setSelected}
        onNewApp={() => {
          if (!verifiedKey) {
            toast.push({
              kind: "warning",
              title: "Verify your API key first",
              message: "You need a verified key to create new apps.",
            });
            return;
          }
          setModalOpen(true);
        }}
        canCreate={!!verifiedKey}
      />
      <PreviewPanel
        app={selected}
        apiKey={apiKey}
        setApiKey={setApiKey}
        verifiedKey={verifiedKey}
        setVerifiedKey={setVerifiedKey}
        provider={provider}
        setProvider={setProvider}
        reloadToken={reloadToken}
      />
      <ChatPanel
        app={selected}
        verifiedKey={verifiedKey}
        onAfterSend={() => setReloadToken((t) => t + 1)}
      />

      <NewAppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => loadApps(id)}
      />
      <DropOverlay visible={dragOver} />
    </div>
  );
}

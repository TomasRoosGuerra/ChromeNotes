import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useNotesStore } from "../../store/notesStore";

type SyncStatus = "idle" | "saving" | "saved" | "offline";

export const SyncIndicator = () => {
  const user = useAuthStore((s) => s.user);
  const mainTabs = useNotesStore((s) => s.mainTabs);
  const [status, setStatus] = useState<SyncStatus>("idle");

  useEffect(() => {
    if (!user) return;

    const handleOnline = () => setStatus("saved");
    const handleOffline = () => setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      setStatus("offline");
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [user]);

  useEffect(() => {
    if (!user || !navigator.onLine) return;
    setStatus("saving");
    const timeout = setTimeout(() => setStatus("saved"), 1200);
    return () => clearTimeout(timeout);
  }, [mainTabs, user]);

  if (!user) return null;

  const config = {
    idle: { dot: "bg-gray-400", text: "" },
    saving: { dot: "bg-amber-400 animate-pulse", text: "Saving..." },
    saved: { dot: "bg-emerald-500", text: "Saved" },
    offline: { dot: "bg-red-400", text: "Offline" },
  }[status];

  if (status === "idle") return null;

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-[var(--placeholder-color)] select-none">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.text}</span>
    </div>
  );
};

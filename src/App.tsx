import { useCallback, useEffect } from "react";
import { LoadingScreen } from "./components/auth/LoadingScreen";
import { SignInScreen } from "./components/auth/SignInScreen";
import { Editor } from "./components/editor/Editor";
import { Toolbar } from "./components/editor/Toolbar";
import { DoneLog } from "./components/tabs/DoneLog";
import { PlanningView } from "./components/planning/PlanningView";
import { MainTabs } from "./components/tabs/MainTabs";
import { SubTabs } from "./components/tabs/SubTabs";
import { ToastContainer } from "./components/ui/Toast";
import { useCloudSync } from "./hooks/useCloudSync";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAuthStore } from "./store/authStore";
import { setUserId, useNotesStore } from "./store/notesStore";

function App() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initAuth = useAuthStore((state) => state.initAuth);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const setActiveMainTab = useNotesStore((state) => state.setActiveMainTab);
  const showMainTabs = useNotesStore((state) => state.showMainTabs);
  const showSubTabs = useNotesStore((state) => state.showSubTabs);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Cmd/Ctrl+1-9 to switch main tabs
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && num <= mainTabs.length) {
        e.preventDefault();
        setActiveMainTab(mainTabs[num - 1].id);
      }
    },
    [mainTabs, setActiveMainTab]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  useEffect(() => {
    setUserId(user?.uid ?? null);
  }, [user]);

  useLocalStorage();
  useCloudSync();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <SignInScreen />;
  }

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);
  const showDoneLog = activeSubTabId === "done-log";
  const showPlanning = activeMainTab?.mode === "planning" && !showDoneLog;

  return (
    <>
      <div className="h-screen flex flex-col bg-[var(--bg-color)] safe-area-top">
        {/* Tabs stay fixed at top – no scroll */}
        <header className="flex-shrink-0 z-20 bg-[var(--bg-color)]/95 backdrop-blur-sm">
          {showMainTabs && <MainTabs />}
          {showSubTabs && <SubTabs />}
        </header>
        {/* Only this content area scrolls; toolbar stays visible */}
        <div className="flex-grow min-h-0 flex flex-col">
          {showDoneLog ? (
            <>
              <div className="flex-shrink-0">
                <Toolbar editor={null} />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto">
                <DoneLog />
              </div>
            </>
          ) : showPlanning ? (
            <PlanningView />
          ) : (
            <Editor />
          )}
        </div>
      </div>
      <ToastContainer />
    </>
  );
}

export default App;

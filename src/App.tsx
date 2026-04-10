import { useCallback, useEffect } from "react";
import { FiChevronRight, FiMenu } from "react-icons/fi";
import { LoadingScreen } from "./components/auth/LoadingScreen";
import { SignInScreen } from "./components/auth/SignInScreen";
import { Editor } from "./components/editor/Editor";
import { Toolbar } from "./components/editor/Toolbar";
import { Sidebar } from "./components/layout/Sidebar";
import { MainTabs } from "./components/tabs/MainTabs";
import { SubTabs } from "./components/tabs/SubTabs";
import { DoneLog } from "./components/tabs/DoneLog";
import { PlanningView } from "./components/planning/PlanningView";
import { ToastContainer } from "./components/ui/Toast";
import { SyncIndicator } from "./components/ui/SyncIndicator";
import { useCloudSync } from "./hooks/useCloudSync";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAuthStore } from "./store/authStore";
import { AppChromeProvider, useAppChrome } from "./context/AppChromeContext";
import { setUserId, useNotesStore } from "./store/notesStore";

function AppShell() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initAuth = useAuthStore((state) => state.initAuth);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const setActiveMainTab = useNotesStore((state) => state.setActiveMainTab);
  const showMainTabs = useNotesStore((state) => state.showMainTabs);
  const showSubTabs = useNotesStore((state) => state.showSubTabs);
  const useSidebarLayout = useNotesStore((state) => state.useSidebarLayout);
  const { toggleSidebar, collapsed: chromeCollapsed } = useAppChrome();

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
  const activeSubTab =
    activeMainTab?.mode !== "planning"
      ? activeMainTab?.subTabs.find((s) => s.id === activeSubTabId)
      : undefined;
  const showDoneLog = activeSubTabId === "done-log";
  const showPlanning = activeMainTab?.mode === "planning" && !showDoneLog;

  const contentArea = (
    <div className="flex-grow min-h-0 flex flex-col">
      {showDoneLog ? (
        <>
          <div className="flex-shrink-0">
            <Toolbar editor={null} />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto touch-pan-y overscroll-y-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
            <DoneLog />
          </div>
        </>
      ) : showPlanning ? (
        <PlanningView />
      ) : (
        <Editor />
      )}
    </div>
  );

  if (useSidebarLayout) {
    return (
      <>
        <div className="flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[var(--bg-color)] safe-area-top">
          <header className="flex-shrink-0 z-20 bg-[var(--bg-color)]/95 backdrop-blur-sm border-b border-[var(--border-color)]">
            <div className="flex items-center gap-1.5 px-2 py-1 min-h-[44px] sm:min-h-[34px]">
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-[var(--hover-bg-color)] text-[var(--text-color)] touch-manipulation flex-shrink-0"
                aria-label="Open navigation"
                title="Open navigation"
              >
                <FiMenu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1 min-w-0 flex-1 text-sm">
                <span className="font-medium text-[var(--text-color)] truncate shrink-0 max-w-[40%]">
                  {activeMainTab?.name ?? "Chrome Notes"}
                </span>
                {showDoneLog && (
                  <>
                    <FiChevronRight className="w-3 h-3 text-[var(--placeholder-color)] shrink-0" />
                    <span className="text-[var(--placeholder-color)] truncate">Done</span>
                  </>
                )}
                {activeSubTab && !showDoneLog && (
                  <>
                    <FiChevronRight className="w-3 h-3 text-[var(--placeholder-color)] shrink-0" />
                    <span className="text-[var(--placeholder-color)] truncate">{activeSubTab.name}</span>
                  </>
                )}
                {showPlanning && (
                  <>
                    <FiChevronRight className="w-3 h-3 text-[var(--placeholder-color)] shrink-0" />
                    <span className="text-[var(--placeholder-color)] truncate">Schedule</span>
                  </>
                )}
              </div>
              <SyncIndicator />
            </div>
          </header>
          {contentArea}
        </div>
        <Sidebar />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      <div className="flex min-h-0 h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-[var(--bg-color)] safe-area-top">
        <header className="flex-shrink-0 z-20 bg-[var(--bg-color)]/95 backdrop-blur-sm">
          {showMainTabs && (!chromeCollapsed || showPlanning) && <MainTabs />}
          {showSubTabs && !chromeCollapsed && <SubTabs />}
        </header>
        {contentArea}
      </div>
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <AppChromeProvider>
      <AppShell />
    </AppChromeProvider>
  );
}

export default App;

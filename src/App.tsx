import { Component, useCallback, useEffect, useRef, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { FiChevronRight, FiMenu, FiPlus } from "react-icons/fi";
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
  const addSubTab = useNotesStore((state) => state.addSubTab);
  const addMainTab = useNotesStore((state) => state.addMainTab);
  const setActiveSubTab = useNotesStore((state) => state.setActiveSubTab);
  const { toggleSidebar, collapsed: chromeCollapsed } = useAppChrome();

  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && num <= mainTabs.length) {
        e.preventDefault();
        setActiveMainTab(mainTabs[num - 1].id);
        return;
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        const tab = mainTabs.find((t) => t.id === activeMainTabId);
        if (e.shiftKey) {
          addMainTab();
        } else if (tab && tab.mode !== "planning") {
          addSubTab(tab.id);
        }
        return;
      }

      if (e.shiftKey && (e.key === "[" || e.key === "]")) {
        const tab = mainTabs.find((t) => t.id === activeMainTabId);
        if (!tab || tab.mode === "planning" || tab.subTabs.length < 2) return;
        const idx = tab.subTabs.findIndex((s) => s.id === activeSubTabId);
        if (idx === -1) return;
        const nextIdx =
          e.key === "["
            ? (idx - 1 + tab.subTabs.length) % tab.subTabs.length
            : (idx + 1) % tab.subTabs.length;
        e.preventDefault();
        setActiveSubTab(tab.subTabs[nextIdx].id);
      }
    },
    [mainTabs, activeMainTabId, activeSubTabId, setActiveMainTab, addMainTab, addSubTab, setActiveSubTab],
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

  useEffect(() => {
    if (!fabMenuOpen) return;
    const close = (e: MouseEvent | TouchEvent) => {
      if (fabRef.current?.contains(e.target as Node)) return;
      setFabMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [fabMenuOpen]);

  const contentArea = (
    <div className="flex-grow min-h-0 flex flex-col relative">
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

      {useSidebarLayout && !showPlanning && !showDoneLog && (
        <div ref={fabRef} className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-20">
          {fabMenuOpen && (
            <div className="absolute right-0 bottom-full mb-2 w-44 rounded-xl bg-[var(--bg-color)] border border-[var(--border-color)] shadow-xl py-1 animate-slide-up">
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--hover-bg-color)] text-[var(--text-color)] touch-manipulation"
                onClick={() => {
                  if (activeMainTab && activeMainTab.mode !== "planning") addSubTab(activeMainTab.id);
                  setFabMenuOpen(false);
                }}
              >
                New page
              </button>
              <button
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--hover-bg-color)] text-[var(--text-color)] touch-manipulation"
                onClick={() => { addMainTab(); setFabMenuOpen(false); }}
              >
                New notebook
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              if (activeMainTab && activeMainTab.mode !== "planning") {
                addSubTab(activeMainTab.id);
              } else {
                setFabMenuOpen(true);
              }
            }}
            onContextMenu={(e) => { e.preventDefault(); setFabMenuOpen((v) => !v); }}
            className="w-12 h-12 rounded-full bg-[var(--accent-color)] text-white shadow-lg hover:bg-[var(--accent-hover)] active:scale-95 flex items-center justify-center transition-all touch-manipulation"
            title="New page (hold for options)"
            aria-label="New page"
          >
            <FiPlus className="w-5 h-5" />
          </button>
        </div>
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
                  {activeMainTab?.name ?? "SpontaNotes"}
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

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SpontaNotes crash:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, color: "#ef4444", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <pre style={{ fontSize: 12, opacity: 0.7 }}>{this.state.error.stack}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppChromeProvider>
        <AppShell />
      </AppChromeProvider>
    </ErrorBoundary>
  );
}

export default App;

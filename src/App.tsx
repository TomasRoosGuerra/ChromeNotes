import { useEffect } from "react";
import { LoadingScreen } from "./components/auth/LoadingScreen";
import { SignInScreen } from "./components/auth/SignInScreen";
import { Editor } from "./components/editor/Editor";
import { Toolbar } from "./components/editor/Toolbar";
import { DoneLog } from "./components/tabs/DoneLog";
import { MainTabs } from "./components/tabs/MainTabs";
import { SubTabs } from "./components/tabs/SubTabs";
import { ToastContainer } from "./components/ui/Toast";
import { MoreOptionsMenu } from "./components/ui/MoreOptionsMenu";
import { useCloudSync } from "./hooks/useCloudSync";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useAuthStore } from "./store/authStore";
import { setUserId, useNotesStore } from "./store/notesStore";

function App() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initAuth = useAuthStore((state) => state.initAuth);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const showMainTabs = useNotesStore((state) => state.showMainTabs);
  const showSubTabs = useNotesStore((state) => state.showSubTabs);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

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

  const showDoneLog = activeSubTabId === "done-log";

  return (
    <>
      <div className="h-screen flex flex-col bg-[var(--bg-color)] safe-area-top">
        {/* Tabs stay fixed at top – no scroll */}
        <header className="flex-shrink-0 z-20 bg-[var(--bg-color)]">
          {showMainTabs ? (
            <MainTabs />
          ) : (
            // When main tabs are hidden, still show the options menu so it can be turned back on
            <div className="flex justify-end px-3 sm:px-4 py-3 sm:py-2 border-b border-[var(--border-color)]">
              <MoreOptionsMenu />
            </div>
          )}
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

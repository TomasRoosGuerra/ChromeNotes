import { useEffect } from "react";
import { LoadingScreen } from "./components/auth/LoadingScreen";
import { SignInScreen } from "./components/auth/SignInScreen";
import { Editor } from "./components/editor/Editor";
import { Toolbar } from "./components/editor/Toolbar";
import { DoneLog } from "./components/tabs/DoneLog";
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
      <div className="h-screen flex flex-col bg-[var(--bg-color)]">
        <MainTabs />
        <SubTabs />
        <div className="flex-grow overflow-y-auto">
          {showDoneLog ? (
            <>
              <Toolbar editor={null} />
              <DoneLog />
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

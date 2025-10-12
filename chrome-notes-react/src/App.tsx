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
import { useNotesStore } from "./store/notesStore";

function App() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const initAuth = useAuthStore((state) => state.initAuth);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);

  // Initialize auth on mount
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // Load from localStorage
  useLocalStorage();

  // Sync with cloud
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
        {/* Main Tabs */}
        <MainTabs />

        {/* Sub Tabs */}
        <SubTabs />

        {/* Toolbar - Editor component will handle its own toolbar now */}
        {showDoneLog ? (
          <>
            <Toolbar editor={null} />
            <DoneLog />
          </>
        ) : (
          <Editor />
        )}
      </div>

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
}

export default App;

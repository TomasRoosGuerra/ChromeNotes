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
    console.log("App mounted, initializing auth...");
    initAuth();
  }, [initAuth]);

  // Load from localStorage
  useLocalStorage();

  // Sync with cloud
  useCloudSync();

  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);

  console.log("App render:", {
    user: !!user,
    loading,
    activeSubTabId,
    activeMainTabId,
    mainTabsCount: mainTabs.length,
  });

  if (loading) {
    console.log("Showing loading screen");
    return <LoadingScreen />;
  }

  if (!user) {
    console.log("Showing sign-in screen");
    return <SignInScreen />;
  }

  console.log("Showing main app with tabs:", mainTabs);

  const showDoneLog = activeSubTabId === "done-log";

  return (
    <>
      <div className="h-screen flex flex-col bg-white" style={{ background: 'white' }}>
        {/* Debug info - using inline styles to ensure visibility */}
        <div style={{
          background: '#10b981',
          color: 'white',
          padding: '12px',
          fontSize: '14px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          ✅ REACT APP LOADED! Tabs: {mainTabs.length}, Active Tab: {activeMainTabId}, Sub: {activeSubTabId}
        </div>

        {/* Main Tabs */}
        <div style={{ background: '#f0f0f0', padding: '8px', borderBottom: '2px solid #ccc' }}>
          <MainTabs />
        </div>

        {/* Sub Tabs */}
        <div style={{ background: '#fafafa', padding: '8px', borderBottom: '1px solid #ddd' }}>
          <SubTabs />
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', background: 'white' }}>
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

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
}

export default App;

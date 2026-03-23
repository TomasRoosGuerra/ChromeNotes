import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AppChromeContextValue = {
  /** When true, main/sub tabs are hidden and the editor toolbar is minimal */
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
};

const AppChromeContext = createContext<AppChromeContextValue | null>(null);

export function AppChromeProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => !c);
  }, []);

  const value = useMemo(
    () => ({ collapsed, setCollapsed, toggleCollapsed }),
    [collapsed]
  );

  return (
    <AppChromeContext.Provider value={value}>{children}</AppChromeContext.Provider>
  );
}

export function useAppChrome() {
  const ctx = useContext(AppChromeContext);
  if (!ctx) {
    throw new Error("useAppChrome must be used within AppChromeProvider");
  }
  return ctx;
}

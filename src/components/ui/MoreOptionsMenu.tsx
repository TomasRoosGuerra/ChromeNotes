import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import {
  FiCopy,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiHelpCircle,
  FiLogOut,
  FiMail,
  FiMoreVertical,
  FiTrash2,
  FiUser,
} from "react-icons/fi";
import { emailNotes } from "../../lib/email";
import { formatTabsForCopy, parseImportedContent } from "../../lib/markdown";
import { useAuthStore } from "../../store/authStore";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "./Button";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

const MENU_WIDTH = 288; // w-72
const GAP = 8;

type MenuLayout =
  | { kind: "mobile" }
  | { kind: "desktop"; top: number; left: number; maxHeight: number };

export const MoreOptionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [menuLayout, setMenuLayout] = useState<MenuLayout | null>(null);

  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const hideCompleted = useNotesStore((state) => state.hideCompleted);
  const toggleHideCompleted = useNotesStore(
    (state) => state.toggleHideCompleted
  );
  const showMainTabs = useNotesStore((state) => state.showMainTabs);
  const showSubTabs = useNotesStore((state) => state.showSubTabs);
  const toggleShowMainTabs = useNotesStore(
    (state) => state.toggleShowMainTabs
  );
  const toggleShowSubTabs = useNotesStore((state) => state.toggleShowSubTabs);
  const useSidebarLayout = useNotesStore((state) => state.useSidebarLayout);
  const toggleSidebarLayout = useNotesStore(
    (state) => state.toggleSidebarLayout,
  );
  const showLineNumbers = useNotesStore((state) => state.showLineNumbers);
  const toggleLineNumbers = useNotesStore((state) => state.toggleLineNumbers);
  const setState = useNotesStore((state) => state.loadState);
  const getState = useNotesStore((state) => state.getState);

  const computeLayout = (): MenuLayout => {
    if (typeof window === "undefined") return { kind: "mobile" };
    if (window.innerWidth < 640) return { kind: "mobile" };
    const el = triggerRef.current;
    if (!el) return { kind: "mobile" };
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let left = rect.right - MENU_WIDTH;
    if (left < margin) left = margin;
    if (left + MENU_WIDTH > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - MENU_WIDTH - margin);
    }
    const top = rect.bottom + GAP;
    const maxHeight = Math.max(160, window.innerHeight - top - margin);
    return { kind: "desktop", top, left, maxHeight };
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuLayout(null);
      return;
    }
    setMenuLayout(computeLayout());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => setMenuLayout(computeLayout());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const t = event.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  const handleCopyAll = async () => {
    try {
      const content = formatTabsForCopy(mainTabs);
      await navigator.clipboard.writeText(content);
      toast.success("All tabs copied to clipboard!");
      setIsOpen(false);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const importedTabs = parseImportedContent(text);

      if (importedTabs.length > 0) {
        const currentState = getState();
        setState({
          ...currentState,
          mainTabs: [...currentState.mainTabs, ...importedTabs],
        });
        toast.success(`Imported ${importedTabs.length} tab(s)!`);
        setIsOpen(false);
      } else {
        toast.error("No valid tabs found in clipboard");
      }
    } catch {
      toast.error("Failed to read from clipboard");
    }
  };

  const handleEmail = () => {
    const defaultEmail = import.meta.env.VITE_DEFAULT_EMAIL || "";
    emailNotes(mainTabs, defaultEmail);
    toast("Opening email client...", { icon: "✉️" });
    setIsOpen(false);
  };

  const handleCleanAll = () => {
    if (
      confirm(
        "Are you sure you want to delete all content, completed tasks, and planning tasks? This cannot be undone."
      )
    ) {
      const currentState = getState();
      const cleanedTabs = currentState.mainTabs.map((tab) => ({
        ...tab,
        subTabs: tab.subTabs.map((subTab) => ({
          ...subTab,
          content: "",
        })),
      }));

      setState({
        ...currentState,
        mainTabs: cleanedTabs,
        completedTasks: [],
        planning: {
          ...currentState.planning,
          tasks: [],
        },
      });
      toast.success("Everything cleaned!");
      setIsOpen(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
      setIsOpen(false);
    }
  };

  const menuBody = (
    <>
      {user && (
        <div className="sm:hidden px-4 py-3 border-b border-[var(--border-color)] mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--accent-color)] flex items-center justify-center text-white font-semibold">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-color)] truncate">
                {user.displayName || "User"}
              </p>
              <p className="text-xs text-[var(--placeholder-color)] truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleImport}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        <FiDownload className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-base sm:text-sm font-medium">
          Import from clipboard
        </span>
      </button>

      <button
        type="button"
        onClick={handleCopyAll}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        <FiCopy className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-base sm:text-sm font-medium">
          Copy all tabs
        </span>
      </button>

      <button
        type="button"
        onClick={handleEmail}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        <FiMail className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-base sm:text-sm font-medium">
          Email all notes
        </span>
      </button>

      <div className="border-t border-[var(--border-color)] my-1" />

      <button
        type="button"
        onClick={toggleHideCompleted}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        {hideCompleted ? (
          <FiEye className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        ) : (
          <FiEyeOff className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        )}
        <span className="text-base sm:text-sm font-medium">
          {hideCompleted
            ? "Show completed tasks"
            : "Hide completed tasks"}
        </span>
      </button>

      <button
        type="button"
        onClick={toggleShowMainTabs}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        {showMainTabs ? (
          <FiEyeOff className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        ) : (
          <FiEye className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        )}
        <span className="text-base sm:text-sm font-medium">
          {showMainTabs ? "Hide top tabs (main)" : "Show top tabs (main)"}
        </span>
      </button>

      <button
        type="button"
        onClick={toggleShowSubTabs}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        {showSubTabs ? (
          <FiEyeOff className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        ) : (
          <FiEye className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        )}
        <span className="text-base sm:text-sm font-medium">
          {showSubTabs
            ? "Hide middle tabs (sub)"
            : "Show middle tabs (sub)"}
        </span>
      </button>

      <div className="border-t border-[var(--border-color)] my-1" />

      <button
        type="button"
        onClick={toggleSidebarLayout}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        {useSidebarLayout ? (
          <FiEye className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        ) : (
          <FiEyeOff className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        )}
        <span className="text-base sm:text-sm font-medium">
          {useSidebarLayout ? "Use top tab bar" : "Use sidebar menu"}
        </span>
      </button>

      <button
        type="button"
        onClick={toggleLineNumbers}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        {showLineNumbers ? (
          <FiEyeOff className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        ) : (
          <FiEye className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        )}
        <span className="text-base sm:text-sm font-medium">
          {showLineNumbers ? "Hide line numbers" : "Show line numbers"}
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          setShowShortcuts(true);
          setIsOpen(false);
        }}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        <FiHelpCircle className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-base sm:text-sm font-medium">
          Keyboard shortcuts
        </span>
        <span className="ml-auto text-[10px] text-[var(--placeholder-color)] hidden sm:inline">
          {/Mac|iPod|iPhone|iPad/.test(navigator.userAgent) ? "⌘/" : "Ctrl+/"}
        </span>
      </button>

      <div className="border-t border-[var(--border-color)] my-1" />

      <button
        type="button"
        onClick={handleCleanAll}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors touch-manipulation"
      >
        <FiTrash2 className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-base sm:text-sm font-medium">
          Clean all tabs
        </span>
      </button>

      <div className="border-t border-[var(--border-color)] my-1" />

      <button
        type="button"
        onClick={handleSignOut}
        className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
      >
        <FiLogOut className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="text-base sm:text-sm font-semibold">Sign Out</span>
      </button>

      <div className="sm:hidden border-t border-[var(--border-color)] mt-2 pt-2 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="w-full py-3 text-center text-base font-medium text-[var(--accent-color)] hover:bg-[var(--hover-bg-color)] rounded-lg transition-colors touch-manipulation"
        >
          Cancel
        </button>
      </div>
    </>
  );

  const portal =
    isOpen && menuLayout && typeof document !== "undefined"
      ? createPortal(
          <>
            <div
              className={
                menuLayout.kind === "mobile"
                  ? "fixed inset-0 z-[200] bg-black/25"
                  : "fixed inset-0 z-[200] bg-transparent"
              }
              aria-hidden
              onClick={() => setIsOpen(false)}
            />
            <div
              ref={panelRef}
              role="menu"
              aria-label="More options"
              className={
                menuLayout.kind === "mobile"
                  ? "fixed z-[201] bottom-0 left-0 right-0 flex w-full max-h-[min(85dvh,100dvh)] flex-col overflow-y-auto overscroll-contain rounded-t-2xl border border-b-0 border-[var(--border-color)] bg-[var(--bg-color)] py-2 shadow-2xl pb-[max(0.5rem,env(safe-area-inset-bottom))]"
                  : "fixed z-[201] flex max-h-[min(500px,calc(100vh-16px))] w-[min(18rem,calc(100vw-16px))] flex-col overflow-y-auto overscroll-contain rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] py-2 shadow-2xl"
              }
              style={
                menuLayout.kind === "desktop"
                  ? {
                      top: menuLayout.top,
                      left: menuLayout.left,
                      maxHeight: menuLayout.maxHeight,
                    }
                  : undefined
              }
            >
              {menuBody}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="relative flex items-center gap-2">
      {user && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--hover-bg-color)] rounded-lg border border-[var(--border-color)]">
          <FiUser className="w-4 h-4 text-[var(--accent-color)]" />
          <span className="text-sm text-[var(--text-color)] truncate max-w-[150px]">
            {user.email}
          </span>
        </div>
      )}

      <div ref={triggerRef} className="inline-flex flex-shrink-0">
        <Button
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          title="More options"
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex-shrink-0"
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          <FiMoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>
      </div>

      {portal}

      {showShortcuts && (
        <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />
      )}
    </div>
  );
};

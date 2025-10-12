import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiCopy,
  FiDownload,
  FiEye,
  FiEyeOff,
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

export const MoreOptionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const hideCompleted = useNotesStore((state) => state.hideCompleted);
  const toggleHideCompleted = useNotesStore(
    (state) => state.toggleHideCompleted
  );
  const setState = useNotesStore((state) => state.loadState);
  const getState = useNotesStore((state) => state.getState);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyAll = async () => {
    try {
      const content = formatTabsForCopy(mainTabs);
      await navigator.clipboard.writeText(content);
      toast.success("All tabs copied to clipboard!");
      setIsOpen(false);
    } catch (error) {
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
    } catch (error) {
      toast.error("Failed to read from clipboard");
    }
  };

  const handleEmail = () => {
    const defaultEmail = import.meta.env.VITE_DEFAULT_EMAIL || "";
    emailNotes(mainTabs, defaultEmail);
    toast.info("Opening email client...");
    setIsOpen(false);
  };

  const handleCleanAll = () => {
    if (
      confirm(
        "Are you sure you want to delete all content from all tabs? This cannot be undone."
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

      setState({ ...currentState, mainTabs: cleanedTabs });
      toast.success("All tabs cleaned!");
      setIsOpen(false);
    }
  };

  const handleSignOut = async () => {
    if (confirm("Are you sure you want to sign out?")) {
      await signOut();
      setIsOpen(false);
    }
  };

  return (
    <div className="relative flex items-center gap-2" ref={menuRef}>
      {/* User Info - Desktop Only */}
      {user && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-[var(--hover-bg-color)] rounded-lg border border-[var(--border-color)]">
          <FiUser className="w-4 h-4 text-[var(--accent-color)]" />
          <span className="text-sm text-[var(--text-color)] truncate max-w-[150px]">
            {user.email}
          </span>
        </div>
      )}

      {/* Menu Button */}
      <Button
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        title="More options"
        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex-shrink-0"
      >
        <FiMoreVertical className="w-5 h-5 sm:w-4 sm:h-4" />
      </Button>

      {/* Dropdown Menu - Mobile Optimized */}
      {isOpen && (
        <>
          {/* Desktop: Invisible overlay to catch clicks */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="fixed bottom-0 sm:bottom-auto right-0 sm:right-4 left-0 sm:left-auto sm:top-16 w-full sm:w-72 bg-[var(--bg-color)] border-t sm:border border-[var(--border-color)] sm:rounded-xl shadow-2xl z-50 py-2 max-h-[80vh] sm:max-h-[500px] overflow-y-auto">
            {/* Mobile: User info at top */}
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

            {/* Menu Items - Touch Optimized */}
            <button
              onClick={handleImport}
              className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
            >
              <FiDownload className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-base sm:text-sm font-medium">
                Import from clipboard
              </span>
            </button>

            <button
              onClick={handleCopyAll}
              className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
            >
              <FiCopy className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-base sm:text-sm font-medium">
                Copy all tabs
              </span>
            </button>

            <button
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

            <div className="border-t border-[var(--border-color)] my-1" />

            <button
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
              onClick={handleSignOut}
              className="w-full px-4 py-3 sm:px-3 sm:py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors touch-manipulation text-[var(--text-color)]"
            >
              <FiLogOut className="w-5 h-5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="text-base sm:text-sm font-semibold">
                Sign Out
              </span>
            </button>

            {/* Mobile: Cancel button */}
            <div className="sm:hidden border-t border-[var(--border-color)] mt-2 pt-2 px-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 text-center text-base font-medium text-[var(--accent-color)] hover:bg-[var(--hover-bg-color)] rounded-lg transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

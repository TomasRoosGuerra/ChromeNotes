import { useEffect, useRef, useState } from "react";
import {
  FiCopy,
  FiDownload,
  FiEye,
  FiEyeOff,
  FiMail,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";
import { emailNotes } from "../../lib/email";
import { formatTabsForCopy, parseImportedContent } from "../../lib/markdown";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "./Button";
import { showToast } from "./Toast";

export const MoreOptionsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const notesState = useNotesStore((state) => state.getState());
  const setState = useNotesStore((state) => state.setState);
  const hideCompleted = useNotesStore((state) => state.hideCompleted);
  const toggleHideCompleted = useNotesStore(
    (state) => state.toggleHideCompleted
  );

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
      const content = formatTabsForCopy(notesState);
      await navigator.clipboard.writeText(content);
      showToast.success("All tabs copied to clipboard!");
      setIsOpen(false);
    } catch (error) {
      showToast.error("Failed to copy to clipboard");
    }
  };

  const handleImport = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const importedTabs = parseImportedContent(text);

      if (importedTabs.length > 0) {
        setState({
          mainTabs: [...notesState.mainTabs, ...importedTabs],
        });
        showToast.success(`Imported ${importedTabs.length} tab(s)!`);
        setIsOpen(false);
      } else {
        showToast.error("No valid tabs found in clipboard");
      }
    } catch (error) {
      showToast.error("Failed to read from clipboard");
    }
  };

  const handleEmail = () => {
    const defaultEmail = import.meta.env.VITE_DEFAULT_EMAIL || "";
    emailNotes(notesState, defaultEmail);
    showToast.info("Opening email client...");
    setIsOpen(false);
  };

  const handleCleanAll = () => {
    if (
      confirm(
        "Are you sure you want to delete all content from all tabs? This cannot be undone."
      )
    ) {
      const cleanedTabs = notesState.mainTabs.map((tab) => ({
        ...tab,
        subTabs: tab.subTabs.map((subTab) => ({
          ...subTab,
          content: "",
        })),
      }));

      setState({ mainTabs: cleanedTabs });
      showToast.success("All tabs cleaned!");
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button size="sm" onClick={() => setIsOpen(!isOpen)} title="More options">
        <FiMoreVertical />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-xl z-50 py-1">
          <button
            onClick={handleImport}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            <span>Import from clipboard</span>
          </button>

          <button
            onClick={handleCopyAll}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors"
          >
            <FiCopy className="w-4 h-4" />
            <span>Copy all tabs</span>
          </button>

          <button
            onClick={handleEmail}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors"
          >
            <FiMail className="w-4 h-4" />
            <span>Email all notes</span>
          </button>

          <div className="border-t border-[var(--border-color)] my-1" />

          <button
            onClick={toggleHideCompleted}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-[var(--hover-bg-color)] transition-colors"
          >
            {hideCompleted ? (
              <FiEye className="w-4 h-4" />
            ) : (
              <FiEyeOff className="w-4 h-4" />
            )}
            <span>
              {hideCompleted ? "Show completed tasks" : "Hide completed tasks"}
            </span>
          </button>

          <div className="border-t border-[var(--border-color)] my-1" />

          <button
            onClick={handleCleanAll}
            className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors"
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Clean all tabs</span>
          </button>
        </div>
      )}
    </div>
  );
};

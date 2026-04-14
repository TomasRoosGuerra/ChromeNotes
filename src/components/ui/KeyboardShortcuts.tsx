import { useEffect } from "react";
import { FiX } from "react-icons/fi";

interface KeyboardShortcutsProps {
  onClose: () => void;
}

const isMac =
  typeof navigator !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
const mod = isMac ? "⌘" : "Ctrl";

const shortcuts = [
  { section: "Text Formatting" },
  { keys: `${mod}+B`, label: "Bold" },
  { keys: `${mod}+I`, label: "Italic" },
  { keys: `${mod}+Shift+X`, label: "Strikethrough" },
  { section: "Structure" },
  { keys: "# + Space", label: "Heading 1" },
  { keys: "## + Space", label: "Heading 2" },
  { keys: "### + Space", label: "Heading 3" },
  { keys: "- + Space", label: "Bullet list" },
  { keys: "1. + Space", label: "Numbered list" },
  { keys: "-. + Space", label: "Task list" },
  { keys: "-- + Space", label: "Task list (alt)" },
  { keys: "> + Space", label: "Blockquote" },
  { keys: "Tab", label: "Indent list item" },
  { keys: "Shift+Tab", label: "Outdent list item" },
  { section: "Navigation & Tools" },
  { keys: `${mod}+F`, label: "Find in note" },
  { keys: `${mod}+Shift+L`, label: "Toggle line numbers (margin)" },
  { keys: `${mod}+Shift+H`, label: "Toggle current-line highlight" },
  { keys: "Alt+P", label: "Set progress %" },
  { keys: "Alt+↑ / Alt+↓", label: "Move list item up/down" },
  { keys: `${mod}+Z`, label: "Undo" },
  { keys: `${mod}+Y`, label: "Redo" },
  { section: "Collapse & Sections" },
  { keys: "Click ▾ on heading", label: "Collapse/expand section" },
  { keys: "Click ▾ on list item", label: "Collapse/expand nested items" },
  { keys: `${mod}+Shift+[`, label: "Collapse at cursor" },
  { keys: `${mod}+Shift+]`, label: "Expand at cursor" },
  { section: "Quick Capture" },
  { keys: `${mod}+N`, label: "New page" },
  { keys: `${mod}+Shift+N`, label: "New notebook" },
  { section: "Tabs & Navigation" },
  { keys: `${mod}+1–9`, label: "Switch to notebook 1–9" },
  { keys: `${mod}+Shift+[`, label: "Previous page" },
  { keys: `${mod}+Shift+]`, label: "Next page" },
  { keys: `${mod}+/`, label: "Show keyboard shortcuts" },
];

export const KeyboardShortcuts = ({ onClose }: KeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:w-96 max-w-[100vw] max-h-[85vh] sm:max-h-[70vh] overflow-hidden animate-slide-up sm:animate-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="font-semibold text-sm">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg-color)] transition-colors"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-3 space-y-1" style={{ maxHeight: "calc(85vh - 60px)" }}>
          {shortcuts.map((item, i) => {
            if ("section" in item && item.section) {
              return (
                <div
                  key={i}
                  className="text-[10px] uppercase font-semibold text-[var(--placeholder-color)] tracking-wider pt-3 pb-1 first:pt-0"
                >
                  {item.section}
                </div>
              );
            }
            return (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
              >
                <span className="text-sm text-[var(--text-color)]">
                  {item.label}
                </span>
                <kbd className="px-2 py-0.5 rounded bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs font-mono text-[var(--placeholder-color)] whitespace-nowrap">
                  {item.keys}
                </kbd>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

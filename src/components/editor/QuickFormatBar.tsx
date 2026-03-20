import type { Editor } from "@tiptap/react";
import {
  FiBarChart2,
  FiBold,
  FiCheckSquare,
  FiItalic,
  FiLink,
  FiList,
  FiCornerDownLeft,
  FiCornerUpLeft,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { linkShortcutLabel } from "../../lib/platformShortcut";
import { Button } from "../ui/Button";

interface QuickFormatBarProps {
  editor: Editor | null;
  onSetProgress?: () => void;
  onAddLink?: () => void;
}

export const QuickFormatBar = ({
  editor,
  onSetProgress,
  onAddLink,
}: QuickFormatBarProps) => {
  if (!editor) return null;

  // Keep the bar above the on-screen keyboard using VisualViewport (where available),
  // but avoid jitter by only reacting to meaningful changes.
  const [bottomOffset, setBottomOffset] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const vv = window.visualViewport;
    if (!vv) return;

    const updateOffset = () => {
      // How much of the layout viewport is covered by keyboard/system UI
      const rawOffset = window.innerHeight - (vv.height + vv.offsetTop);
      // Treat very small changes as noise to avoid flicker
      const threshold = 24; // px
      const offset = rawOffset > threshold ? rawOffset : 0;
      setBottomOffset(offset);
    };

    updateOffset();
    vv.addEventListener("resize", updateOffset);
    vv.addEventListener("scroll", updateOffset);

    return () => {
      vv.removeEventListener("resize", updateOffset);
      vv.removeEventListener("scroll", updateOffset);
    };
  }, []);

  const inTaskList = editor.isActive("taskList");
  const inBulletOrOrdered =
    editor.isActive("bulletList") || editor.isActive("orderedList");
  const inList = inTaskList || inBulletOrOrdered;
  const inListItem =
    editor.isActive("listItem") || editor.isActive("taskItem") || false;
  const listItemType = inTaskList ? "taskItem" : "listItem";
  const canSink = inList && editor.can().sinkListItem(listItemType);
  const canLift = inList && editor.can().liftListItem(listItemType);

  return (
    <div
      className="sm:hidden fixed left-0 right-0 bg-[var(--bg-color)]/95 backdrop-blur-sm border-t border-[var(--border-color)] p-2 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
      style={{ bottom: bottomOffset }}
    >
      <div className="flex items-center justify-around gap-2 overflow-x-auto flex-nowrap scrollbar-thin pb-1 -mb-1">
        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().sinkListItem(listItemType).run()
          }
          disabled={!canSink}
          className={`flex-1 min-h-[48px] ${
            canSink ? "" : "opacity-50 pointer-events-none"
          }`}
          title="Indent (Tab)"
        >
          <FiCornerDownLeft className="w-5 h-5" aria-hidden />
        </Button>

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().liftListItem(listItemType).run()
          }
          disabled={!canLift}
          className={`flex-1 min-h-[48px] ${
            canLift ? "" : "opacity-50 pointer-events-none"
          }`}
          title="Outdent (Shift+Tab)"
        >
          <FiCornerUpLeft className="w-5 h-5" aria-hidden />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 ${
            editor.isActive("bold") ? "bg-[var(--accent-color)] text-white" : ""
          }`}
          title="Bold (Ctrl+B)"
        >
          <FiBold className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 ${
            editor.isActive("italic")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Italic (Ctrl+I)"
        >
          <FiItalic className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={onAddLink}
          className={`flex-1 min-h-[48px] transition-colors duration-150 ${
            editor.isActive("link")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title={`Add link (${linkShortcutLabel()})`}
        >
          <FiLink className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 ${
            editor.isActive("bulletList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="List (- )"
        >
          <FiList className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 text-xs font-bold ${
            editor.isActive("heading", { level: 1 })
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Heading 1 (# )"
        >
          H1
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 text-xs font-bold ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Heading 2 (## )"
        >
          H2
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 text-xs font-semibold ${
            editor.isActive("heading", { level: 3 })
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Heading 3 (### )"
        >
          H3
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`flex-1 min-h-[48px] transition-colors duration-150 ${
            editor.isActive("taskList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Tasks (-. )"
        >
          <FiCheckSquare className="w-5 h-5" />
        </Button>

        {inListItem && onSetProgress && (
          <Button
            size="sm"
            onClick={onSetProgress}
            className="flex-1 min-h-[48px] transition-colors duration-150"
            title="Set progress % (Alt+P)"
          >
            <FiBarChart2 className="w-5 h-5" />
          </Button>
        )}
      </div>
    </div>
  );
};


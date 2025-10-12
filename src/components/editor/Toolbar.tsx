import type { Editor } from "@tiptap/react";
import {
  FiBold,
  FiItalic,
  FiList,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
  FiType,
} from "react-icons/fi";
import { Button } from "../ui/Button";

interface ToolbarProps {
  editor: Editor | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar = ({
  editor,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ToolbarProps) => {
  if (!editor) {
    return (
      <div className="border-b border-[var(--border-color)] p-3 sm:p-2 bg-[var(--bg-color)]">
        <div className="flex items-center gap-2 sm:gap-1">
          <Button size="sm" disabled>
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-color)] p-3 sm:p-2 bg-[var(--bg-color)] overflow-x-auto">
      <div className="flex items-center gap-2 sm:gap-1 flex-nowrap sm:flex-wrap">
        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            editor.isActive("bold") ? "bg-[var(--accent-color)] text-white" : ""
          }`}
          title="Bold (Ctrl+B)"
        >
          <FiBold className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            editor.isActive("italic")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Italic (Ctrl+I)"
        >
          <FiItalic className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            editor.isActive("strike")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Strikethrough"
        >
          <FiMinus className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>

        <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-1" />

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-base sm:text-sm font-semibold ${
            editor.isActive("heading", { level: 1 })
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Heading 1"
        >
          H1
        </Button>

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-base sm:text-sm font-semibold ${
            editor.isActive("heading", { level: 2 })
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Heading 2"
        >
          H2
        </Button>

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-base sm:text-sm font-semibold ${
            editor.isActive("heading", { level: 3 })
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Heading 3"
        >
          H3
        </Button>

        <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-1" />

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            editor.isActive("bulletList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Bullet List"
        >
          <FiList className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-lg sm:text-sm font-semibold ${
            editor.isActive("orderedList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Numbered List"
        >
          1.
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-lg sm:text-base ${
            editor.isActive("taskList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Task List"
        >
          ☑
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 ${
            editor.isActive("blockquote")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Blockquote"
        >
          <FiType className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>

        <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-1" />

        <Button
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
        >
          <FiRotateCcw className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>

        <Button
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
        >
          <FiRotateCw className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>
      </div>
    </div>
  );
};

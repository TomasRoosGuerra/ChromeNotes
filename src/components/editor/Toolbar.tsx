import type { Editor } from "@tiptap/react";
import {
  FiBold,
  FiChevronsDown,
  FiItalic,
  FiLink,
  FiList,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
  FiSearch,
  FiType,
} from "react-icons/fi";
import { FiBarChart2 } from "react-icons/fi";
import { linkShortcutLabel } from "../../lib/platformShortcut";
import { Button } from "../ui/Button";
import { MoreOptionsMenu } from "../ui/MoreOptionsMenu";
import { SyncIndicator } from "../ui/SyncIndicator";

function getWordCount(editor: Editor): { words: number; chars: number } {
  const text = editor.state.doc.textContent;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars };
}

interface ToolbarProps {
  editor: Editor | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSetProgress?: () => void;
  onSearch?: () => void;
  onCollapseAll?: () => void;
  onAddLink?: () => void;
}

export const Toolbar = ({
  editor,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSetProgress,
  onSearch,
  onCollapseAll,
  onAddLink,
}: ToolbarProps) => {
  const inListItem =
    editor?.isActive("listItem") || editor?.isActive("taskItem") || false;

  if (!editor) {
    return (
      <div className="border-b border-[var(--border-color)] p-3 sm:p-2 bg-[var(--bg-color)]">
        <div className="flex items-center gap-2 sm:gap-1">
          <MoreOptionsMenu />
          <div className="flex-1" />
          <SyncIndicator />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-color)] p-3 sm:p-2 bg-[var(--bg-color)]/95 backdrop-blur-sm">
      <div className="flex items-center gap-2 sm:gap-1">
        <div className="flex-shrink-0">
          <MoreOptionsMenu />
        </div>

        <div className="flex items-center gap-2 sm:gap-1 flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-thin">
          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150 ${
              editor.isActive("bold")
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Bold (Ctrl+B)"
          >
            <FiBold className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150 ${
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
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150 ${
              editor.isActive("strike")
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Strikethrough"
          >
            <FiMinus className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>

          <Button
            size="sm"
            onClick={onAddLink}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150 ${
              editor.isActive("link")
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title={`Add link (${linkShortcutLabel()})`}
          >
            <FiLink className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>

          <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-0.5" />

          <Button
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-base sm:text-sm font-semibold transition-colors duration-150 ${
              editor.isActive("heading", { level: 1 })
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Heading 1 (#)"
          >
            H1
          </Button>

          <Button
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-base sm:text-sm font-semibold transition-colors duration-150 ${
              editor.isActive("heading", { level: 2 })
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Heading 2 (##)"
          >
            H2
          </Button>

          <Button
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-base sm:text-sm font-semibold transition-colors duration-150 ${
              editor.isActive("heading", { level: 3 })
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Heading 3 (###)"
          >
            H3
          </Button>

          <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-0.5" />

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150 ${
              editor.isActive("bulletList")
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Bullet List (-)"
          >
            <FiList className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-lg sm:text-sm font-semibold transition-colors duration-150 ${
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
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-lg sm:text-base transition-colors duration-150 ${
              editor.isActive("taskList")
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Task List (-.)"
          >
            ☑
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150 ${
              editor.isActive("blockquote")
                ? "bg-[var(--accent-color)] text-white"
                : ""
            }`}
            title="Blockquote (>)"
          >
            <FiType className="w-5 h-5 sm:w-4 sm:h-4" />
          </Button>

          {onSetProgress && (
            <>
              <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-0.5" />
              <Button
                size="sm"
                onClick={onSetProgress}
                disabled={!inListItem}
                className={`min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 gap-1 transition-colors duration-150 ${
                  !inListItem ? "opacity-40" : ""
                }`}
                title={
                  inListItem
                    ? "Set progress % (Alt+P)"
                    : "Place cursor in a list item first"
                }
              >
                <FiBarChart2 className="w-5 h-5 sm:w-4 sm:h-4 shrink-0" />
                <span className="hidden sm:inline text-xs">%</span>
              </Button>
            </>
          )}

          <div className="w-px h-10 sm:h-6 bg-[var(--border-color)] mx-0.5" />

          {onSearch && (
            <Button
              size="sm"
              onClick={onSearch}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150"
              title="Find (Ctrl+F)"
            >
              <FiSearch className="w-5 h-5 sm:w-4 sm:h-4" />
            </Button>
          )}

          {onCollapseAll && (
            <Button
              size="sm"
              onClick={onCollapseAll}
              className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 transition-colors duration-150"
              title="Collapse / Expand all sections"
            >
              <FiChevronsDown className="w-5 h-5 sm:w-4 sm:h-4" />
            </Button>
          )}

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

        <div className="flex-shrink-0 ml-auto hidden sm:flex items-center gap-3">
          {editor && (() => {
            const { words } = getWordCount(editor);
            if (words === 0) return null;
            return (
              <span className="text-[10px] text-[var(--placeholder-color)] tabular-nums select-none" title={`${getWordCount(editor).chars} characters`}>
                {words} {words === 1 ? "word" : "words"}
              </span>
            );
          })()}
          <SyncIndicator />
        </div>
      </div>
    </div>
  );
};

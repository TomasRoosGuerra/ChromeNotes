import type { Editor } from "@tiptap/react";
import {
  FiBarChart2,
  FiBold,
  FiChevronDown,
  FiChevronUp,
  FiChevronsDown,
  FiItalic,
  FiLink,
  FiList,
  FiMaximize2,
  FiMinimize2,
  FiMinus,
  FiRotateCcw,
  FiRotateCw,
  FiSearch,
  FiType,
  FiZoomIn,
  FiZoomOut,
} from "react-icons/fi";
import { linkShortcutLabel } from "../../lib/platformShortcut";
import { Button } from "../ui/Button";
import { MoreOptionsMenu } from "../ui/MoreOptionsMenu";
import { SyncIndicator } from "../ui/SyncIndicator";

const TB =
  "min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 transition-colors duration-150";
const TB_ACTIVE = `${TB} bg-[var(--accent-color)] text-white`;
const ICON = "w-4 h-4 sm:w-[14px] sm:h-[14px]";
const SEP = "w-px h-7 sm:h-5 bg-[var(--border-color)] mx-0.5";

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
  zoomPercent?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  contentWidthLabel?: string;
  canNarrower?: boolean;
  canWider?: boolean;
  onWidthNarrower?: () => void;
  onWidthWider?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
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
  zoomPercent = 100,
  onZoomIn,
  onZoomOut,
  contentWidthLabel = "Full",
  canNarrower = false,
  canWider = false,
  onWidthNarrower,
  onWidthWider,
  collapsed = false,
  onToggleCollapse,
}: ToolbarProps) => {
  const inListItem =
    editor?.isActive("listItem") || editor?.isActive("taskItem") || false;

  if (!editor) {
    return (
      <div className="border-b border-[var(--border-color)] px-2 py-1.5 sm:px-2 sm:py-1 bg-[var(--bg-color)]">
        <div className="flex items-center gap-1.5 sm:gap-1">
          <MoreOptionsMenu />
          <div className="flex-1" />
          <SyncIndicator />
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div
        className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm cursor-pointer select-none group"
        onClick={onToggleCollapse}
        title="Show toolbar"
      >
        <div className="flex items-center gap-1.5 px-2 py-1">
          <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <MoreOptionsMenu />
          </div>
          <button
            className="flex items-center gap-1 text-[10px] text-[var(--placeholder-color)] group-hover:text-[var(--text-color)] transition-colors"
            title="Show toolbar"
          >
            <FiChevronDown className="w-3 h-3" />
            <span className="hidden sm:inline">Toolbar</span>
          </button>
          <div className="flex-1" />
          <SyncIndicator />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-color)] px-2 py-1.5 sm:px-2 sm:py-1 bg-[var(--bg-color)]/95 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 sm:gap-1">
        <div className="flex-shrink-0">
          <MoreOptionsMenu />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-0.5 flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-thin">
          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? TB_ACTIVE : TB}
            title="Bold (Ctrl+B)"
          >
            <FiBold className={ICON} />
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? TB_ACTIVE : TB}
            title="Italic (Ctrl+I)"
          >
            <FiItalic className={ICON} />
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? TB_ACTIVE : TB}
            title="Strikethrough"
          >
            <FiMinus className={ICON} />
          </Button>

          <Button
            size="sm"
            onClick={onAddLink}
            className={editor.isActive("link") ? TB_ACTIVE : TB}
            title={`Add link (${linkShortcutLabel()})`}
          >
            <FiLink className={ICON} />
          </Button>

          <div className={SEP} />

          {([1, 2, 3] as const).map((level) => (
            <Button
              key={level}
              size="sm"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level }).run()
              }
              className={`${
                editor.isActive("heading", { level }) ? TB_ACTIVE : TB
              } text-sm sm:text-xs font-semibold`}
              title={`Heading ${level} (${"#".repeat(level)})`}
            >
              H{level}
            </Button>
          ))}

          <div className={SEP} />

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? TB_ACTIVE : TB}
            title="Bullet List (-)"
          >
            <FiList className={ICON} />
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${
              editor.isActive("orderedList") ? TB_ACTIVE : TB
            } text-base sm:text-xs font-semibold`}
            title="Numbered List"
          >
            1.
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`${
              editor.isActive("taskList") ? TB_ACTIVE : TB
            } text-base sm:text-sm`}
            title="Task List (-.)"
          >
            ☑
          </Button>

          <Button
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? TB_ACTIVE : TB}
            title="Blockquote (>)"
          >
            <FiType className={ICON} />
          </Button>

          {onSetProgress && (
            <>
              <div className={SEP} />
              <Button
                size="sm"
                onClick={onSetProgress}
                disabled={!inListItem}
                className={`${TB} gap-1 ${!inListItem ? "opacity-40" : ""}`}
                title={
                  inListItem
                    ? "Set progress % (Alt+P)"
                    : "Place cursor in a list item first"
                }
              >
                <FiBarChart2 className={`${ICON} shrink-0`} />
                <span className="hidden sm:inline text-xs">%</span>
              </Button>
            </>
          )}

          <div className={SEP} />

          {onSearch && (
            <Button
              size="sm"
              onClick={onSearch}
              className={TB}
              title="Find (Ctrl+F)"
            >
              <FiSearch className={ICON} />
            </Button>
          )}

          {onCollapseAll && (
            <Button
              size="sm"
              onClick={onCollapseAll}
              className={TB}
              title="Collapse / Expand all sections"
            >
              <FiChevronsDown className={ICON} />
            </Button>
          )}

          <Button
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={TB}
          >
            <FiRotateCcw className={ICON} />
          </Button>

          <Button
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={TB}
          >
            <FiRotateCw className={ICON} />
          </Button>

          {(onZoomIn || onZoomOut) && (
            <>
              <div className={SEP} />
              <Button
                size="sm"
                onClick={onZoomOut}
                disabled={zoomPercent <= 50}
                title="Zoom out"
                className={TB}
              >
                <FiZoomOut className={ICON} />
              </Button>
              <span
                className="text-[10px] tabular-nums text-[var(--placeholder-color)] select-none min-w-[3ch] text-center cursor-pointer"
                title="Reset zoom"
                onClick={() => {
                  if (onZoomIn && onZoomOut) {
                    document.documentElement.style.setProperty(
                      "--editor-zoom",
                      "1"
                    );
                    window.dispatchEvent(new Event("editor-zoom-reset"));
                  }
                }}
              >
                {zoomPercent}%
              </span>
              <Button
                size="sm"
                onClick={onZoomIn}
                disabled={zoomPercent >= 200}
                title="Zoom in"
                className={TB}
              >
                <FiZoomIn className={ICON} />
              </Button>
            </>
          )}

          {(onWidthNarrower || onWidthWider) && (
            <>
              <div className={SEP} />
              <Button
                size="sm"
                onClick={onWidthNarrower}
                disabled={!canNarrower}
                title="Narrower content"
                className={TB}
              >
                <FiMinimize2 className={ICON} />
              </Button>
              <span
                className="text-[10px] tabular-nums text-[var(--placeholder-color)] select-none min-w-[5ch] text-center"
                title="Content width"
              >
                {contentWidthLabel}
              </span>
              <Button
                size="sm"
                onClick={onWidthWider}
                disabled={!canWider}
                title="Wider content"
                className={TB}
              >
                <FiMaximize2 className={ICON} />
              </Button>
            </>
          )}

          {onToggleCollapse && (
            <>
              <div className={SEP} />
              <Button
                size="sm"
                onClick={onToggleCollapse}
                className={TB}
                title="Hide toolbar"
              >
                <FiChevronUp className={ICON} />
              </Button>
            </>
          )}
        </div>

        <div className="flex-shrink-0 ml-auto hidden sm:flex items-center gap-2">
          {(() => {
            const { words, chars } = getWordCount(editor);
            if (words === 0) return null;
            return (
              <span
                className="text-[10px] text-[var(--placeholder-color)] tabular-nums select-none"
                title={`${chars} characters`}
              >
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

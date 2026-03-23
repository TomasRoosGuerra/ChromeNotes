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
import { useAppChrome } from "../../context/AppChromeContext";
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
}

/** Bottom row: word count (left) · centered hide/show · sync (right) */
function ChromeToggleRow({
  editor,
  mode,
}: {
  editor: Editor | null;
  mode: "hide" | "show";
}) {
  const { toggleCollapsed } = useAppChrome();
  const words =
    editor && mode === "hide"
      ? getWordCount(editor).words
      : 0;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 border-t border-[var(--border-color)] pt-1.5 mt-1">
      <div className="min-w-0 flex justify-start items-center">
        {editor && mode === "hide" && words > 0 ? (
          <span
            className="text-[10px] text-[var(--placeholder-color)] tabular-nums select-none truncate pl-0.5"
            title={`${getWordCount(editor).chars} characters`}
          >
            {words} {words === 1 ? "word" : "words"}
          </span>
        ) : (
          <span className="w-px" aria-hidden />
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleCollapsed();
        }}
        className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-full bg-[var(--hover-bg-color)] hover:bg-[var(--border-color)] text-[var(--placeholder-color)] hover:text-[var(--text-color)] transition-colors touch-manipulation min-h-[36px] sm:min-h-[28px]"
        title={
          mode === "hide"
            ? "Hide tabs & toolbar (more space for writing)"
            : "Show tabs & toolbar"
        }
      >
        {mode === "hide" ? (
          <>
            <FiChevronUp className="w-4 h-4" aria-hidden />
            <span className="text-[9px] font-medium uppercase tracking-wide leading-none">
              Hide
            </span>
          </>
        ) : (
          <>
            <FiChevronDown className="w-4 h-4" aria-hidden />
            <span className="text-[9px] font-medium uppercase tracking-wide leading-none max-w-[7rem] text-center">
              Show tabs
            </span>
          </>
        )}
      </button>
      <div className="min-w-0 flex justify-end items-center">
        <SyncIndicator />
      </div>
    </div>
  );
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
}: ToolbarProps) => {
  const { collapsed, toggleCollapsed } = useAppChrome();
  const inListItem =
    editor?.isActive("listItem") || editor?.isActive("taskItem") || false;

  if (!editor) {
    if (collapsed) {
      return (
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1.5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
            <div className="flex justify-start min-w-0">
              <MoreOptionsMenu />
            </div>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full bg-[var(--hover-bg-color)] hover:bg-[var(--border-color)] text-[var(--placeholder-color)] hover:text-[var(--text-color)] transition-colors min-h-[36px] sm:min-h-[28px]"
              title="Show tabs & toolbar"
            >
              <FiChevronDown className="w-4 h-4" aria-hidden />
              <span className="text-[9px] font-medium uppercase tracking-wide text-center max-w-[5.5rem]">
                Show tabs
              </span>
            </button>
            <div className="flex justify-end">
              <SyncIndicator />
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1.5 sm:py-1">
        <div className="flex items-center gap-1.5 sm:gap-1">
          <MoreOptionsMenu />
          <div className="flex-1" />
        </div>
        <ChromeToggleRow editor={null} mode="hide" />
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1.5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
          <div className="flex justify-start min-w-0" onClick={(e) => e.stopPropagation()}>
            <MoreOptionsMenu />
          </div>
          <CollapsedExpandButton />
          <div className="flex justify-end">
            <SyncIndicator />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1.5 sm:py-1">
      <div className="flex items-center gap-1.5 sm:gap-1">
        <div className="flex-shrink-0">
          <MoreOptionsMenu />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-0.5 flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-thin flex-1 min-w-0">
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
        </div>
      </div>

      <ChromeToggleRow editor={editor} mode="hide" />
    </div>
  );
}

function CollapsedExpandButton() {
  const { toggleCollapsed } = useAppChrome();
  return (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-full bg-[var(--hover-bg-color)] hover:bg-[var(--border-color)] text-[var(--placeholder-color)] hover:text-[var(--text-color)] transition-colors min-h-[36px] sm:min-h-[28px]"
      title="Show tabs & toolbar"
    >
      <FiChevronDown className="w-4 h-4" aria-hidden />
      <span className="text-[9px] font-medium uppercase tracking-wide leading-tight text-center max-w-[5.5rem]">
        Show tabs
      </span>
    </button>
  );
}

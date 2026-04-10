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
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { MoreOptionsMenu } from "../ui/MoreOptionsMenu";
import { SyncIndicator } from "../ui/SyncIndicator";

const TB =
  "min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 transition-colors duration-150";
const TB_ACTIVE = `${TB} bg-[var(--accent-color)] text-white`;
const ICON = "w-4 h-4 sm:w-[14px] sm:h-[14px]";
const SEP = "w-px h-7 sm:h-5 bg-[var(--border-color)] mx-0.5";

/** Icon-only chrome toggle — same height as toolbar row, sits after the scroll strip */
const CHROME_ARROW =
  "inline-flex items-center justify-center shrink-0 rounded-lg bg-[var(--hover-bg-color)] active:bg-[var(--border-color)] text-[var(--placeholder-color)] sm:hover:text-[var(--text-color)] sm:hover:bg-[var(--border-color)] transition-colors touch-manipulation select-none [-webkit-tap-highlight-color:transparent] min-h-[44px] min-w-[44px] sm:min-h-9 sm:min-w-9 self-center";

function getWordCount(editor: Editor): { words: number; chars: number } {
  const text = editor.state.doc.textContent;
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars };
}

function ChromeArrowButton({
  direction,
  title,
}: {
  direction: "collapse" | "expand";
  title: string;
}) {
  const { toggleCollapsed } = useAppChrome();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleCollapsed();
      }}
      className={CHROME_ARROW}
      title={title}
      aria-label={title}
    >
      {direction === "collapse" ? (
        <FiChevronUp className="w-5 h-5 sm:w-[18px] sm:h-[18px]" aria-hidden />
      ) : (
        <FiChevronDown className="w-5 h-5 sm:w-[18px] sm:h-[18px]" aria-hidden />
      )}
    </button>
  );
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

/** Word count (desktop) + sync — right cluster; sync always visible on phone */
function ToolbarMeta({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return (
      <div className="flex-shrink-0 flex items-center gap-2">
        <SyncIndicator />
      </div>
    );
  }
  const { words, chars } = getWordCount(editor);
  return (
    <div className="flex-shrink-0 flex items-center gap-2">
      {words > 0 && (
        <span
          className="hidden sm:inline text-[10px] text-[var(--placeholder-color)] tabular-nums select-none"
          title={`${chars} characters`}
        >
          {words} {words === 1 ? "word" : "words"}
        </span>
      )}
      <SyncIndicator />
    </div>
  );
}

/** Current page label for collapsed toolbar context */
function usePageLabel() {
  const mainTabs = useNotesStore((s) => s.mainTabs);
  const activeMainTabId = useNotesStore((s) => s.activeMainTabId);
  const activeSubTabId = useNotesStore((s) => s.activeSubTabId);
  const tab = mainTabs.find((t) => t.id === activeMainTabId);
  if (!tab) return "";
  if (activeSubTabId === "done-log") return "Done";
  if (tab.mode === "planning") return tab.name;
  const sub = tab.subTabs.find((s) => s.id === activeSubTabId);
  return sub?.name ?? tab.name;
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
  const pageLabel = usePageLabel();
  const inListItem =
    editor?.isActive("listItem") || editor?.isActive("taskItem") || false;

  if (!editor) {
    if (collapsed) {
      return (
        <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-1">
          <div className="flex items-center gap-1.5 sm:gap-1 min-h-[44px] sm:min-h-0">
            <div className="flex-shrink-0">
              <MoreOptionsMenu />
            </div>
            <span className="flex-1 min-w-0 text-xs text-[var(--placeholder-color)] truncate text-center">{pageLabel}</span>
            <button
              type="button"
              onClick={toggleCollapsed}
              className={CHROME_ARROW}
              title="Show toolbar"
              aria-label="Show toolbar"
            >
              <FiChevronDown className="w-5 h-5 sm:w-[18px] sm:h-[18px]" aria-hidden />
            </button>
            <ToolbarMeta editor={null} />
          </div>
        </div>
      );
    }
    return (
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1 sm:py-0.5">
        <div className="flex items-center gap-1.5 sm:gap-1 min-h-[44px] sm:min-h-0">
          <div className="flex-shrink-0">
            <MoreOptionsMenu />
          </div>
          <div className="flex-1 min-w-0" />
          <ChromeArrowButton
            direction="collapse"
            title="Hide toolbar"
          />
          <ToolbarMeta editor={null} />
        </div>
      </div>
    );
  }

  if (collapsed) {
    return (
      <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] sm:pb-1">
        <div className="flex items-center gap-1.5 sm:gap-1 min-h-[44px] sm:min-h-0">
          <div
            className="flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreOptionsMenu />
          </div>
          <span className="flex-1 min-w-0 text-xs text-[var(--placeholder-color)] truncate text-center">{pageLabel}</span>
          <button
            type="button"
            onClick={toggleCollapsed}
            className={CHROME_ARROW}
            title="Show toolbar"
            aria-label="Show toolbar"
          >
            <FiChevronDown className="w-5 h-5 sm:w-[18px] sm:h-[18px]" aria-hidden />
          </button>
          <ToolbarMeta editor={editor} />
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur-sm px-2 py-1 sm:py-0.5">
      <div className="flex items-center gap-1.5 sm:gap-1 min-h-[44px] sm:min-h-0">
        <div className="flex-shrink-0">
          <MoreOptionsMenu />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-0.5 flex-nowrap sm:flex-wrap overflow-x-auto scrollbar-thin flex-1 min-w-0 touch-pan-x overscroll-x-contain">
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
              <button
                type="button"
                className="text-[10px] tabular-nums text-[var(--placeholder-color)] hover:text-[var(--text-color)] select-none min-w-[3ch] text-center cursor-pointer rounded px-1 hover:bg-[var(--hover-bg-color)] transition-colors"
                title="Reset zoom to 100%"
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
              </button>
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

        <ChromeArrowButton
          direction="collapse"
          title="Hide toolbar"
        />

        <ToolbarMeta editor={editor} />
      </div>
    </div>
  );
}

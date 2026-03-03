import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import {
  MouseEvent as ReactMouseEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useNotesStore } from "../../store/notesStore";
import { QuickFormatBar } from "./QuickFormatBar";
import { Toolbar } from "./Toolbar";
import { moveListItem } from "./listItemReorder";
import { ListItemProgress } from "./listItemProgress";

const COLLAPSE_GUTTER_PX = 96;

export const Editor = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const setActiveMainTab = useNotesStore((state) => state.setActiveMainTab);
  const setActiveSubTab = useNotesStore((state) => state.setActiveSubTab);
  const updateContent = useNotesStore((state) => state.updateContent);
  const hideCompleted = useNotesStore((state) => state.hideCompleted);

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);
  const activeSubTab = activeMainTab?.subTabs.find(
    (st) => st.id === activeSubTabId
  );

  // If active tab is missing (e.g. after sync), switch to first valid tab
  useEffect(() => {
    if (activeSubTabId === "done-log") return;
    if (mainTabs.length === 0) return;
    if (!activeMainTab) {
      setActiveMainTab(mainTabs[0].id);
      return;
    }
    if (!activeSubTab && activeMainTab.subTabs.length > 0) {
      setActiveSubTab(activeMainTab.subTabs[0].id);
    }
  }, [
    mainTabs,
    activeMainTab,
    activeSubTab,
    activeSubTabId,
    setActiveMainTab,
    setActiveSubTab,
  ]);

  const ListItemReorder = Extension.create({
    name: "listItemReorder",
    addKeyboardShortcuts() {
      return {
        "Alt-ArrowUp": () => moveListItem(this.editor, "up"),
        "Alt-ArrowDown": () => moveListItem(this.editor, "down"),
      };
    },
  });

  const [progressEditor, setProgressEditor] = useState<{
    value: number;
    durationMinutes: number;
    pos: number;
  } | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: "Start typing... Try '# ', '- ', or '-.' for shortcuts",
      }),
      GlobalDragHandle.configure({
        excludedTags: ["p", "h1", "h2", "h3", "blockquote", "hr", "table"],
        dragHandleSelector: ".drag-handle",
      }),
      ListItemReorder,
      ListItemProgress,
    ],
    content: activeSubTab?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-full p-6",
      },
      // Preserve formatting and tables when pasting (Apple Notes–style)
      transformPastedHTML(html) {
        return html;
      },
    },
    onUpdate: ({ editor }) => {
      if (activeMainTab && activeSubTab) {
        updateContent(activeMainTab.id, activeSubTab.id, editor.getHTML());
      }
    },
  });

  useEffect(() => {
    if (editor && activeSubTab) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeSubTab.content) {
        editor.commands.setContent(activeSubTab.content);
      }
    }
  }, [editor, activeSubTab]);

  const handleUndo = useCallback(() => {
    if (editor) {
      editor.chain().focus().undo().run();
    }
  }, [editor]);

  const handleRedo = useCallback(() => {
    if (editor) {
      editor.chain().focus().redo().run();
    }
  }, [editor]);

  const handleEditorClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (!editor) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      const clickX = event.clientX;
      const { state, view } = editor;

      // 1) Heading collapse/expand (make it very forgiving: any click on heading line)
      const heading = target.closest("h1, h2, h3") as HTMLElement | null;
      if (heading) {
        event.preventDefault();
        event.stopPropagation();

        const isCollapsed = heading.dataset.collapsed === "true";
        const nextCollapsed = !isCollapsed;
        heading.dataset.collapsed = nextCollapsed ? "true" : "false";

        const currentLevel = Number(heading.tagName.substring(1)) || 1;

        let sibling = heading.nextElementSibling as HTMLElement | null;
        while (sibling) {
          if (sibling.matches("h1, h2, h3")) {
            const siblingLevel = Number(sibling.tagName.substring(1)) || 1;
            // Same-size or higher-level heading starts a new container
            if (siblingLevel <= currentLevel) {
              break;
            }
          }

          if (nextCollapsed) {
            sibling.classList.add("collapsed-block");
          } else {
            sibling.classList.remove("collapsed-block");
          }
          sibling = sibling.nextElementSibling as HTMLElement | null;
        }
        return;
      }

      // 2) List title collapse/expand or progress pill
      const liElement = target.closest("li") as HTMLElement | null;
      if (!liElement) return;

      const liRect = liElement.getBoundingClientRect();

      const listParent = liElement.parentElement;
      const isTopLevelListItem =
        listParent &&
        listParent.parentElement &&
        listParent.parentElement.classList.contains("ProseMirror");

      // Collapse/expand top-level list titles when clicking in left/center area
      if (isTopLevelListItem) {
        const collapseEdge =
          liRect.left + Math.min(liRect.width * 0.7, COLLAPSE_GUTTER_PX);
        if (clickX <= collapseEdge) {
        event.preventDefault();
        event.stopPropagation();

          const isCollapsed =
            liElement.getAttribute("data-collapsed") === "true";
          const nextCollapsed = !isCollapsed;
          liElement.setAttribute(
            "data-collapsed",
            nextCollapsed ? "true" : "false"
          );

          const nestedItems = liElement.querySelectorAll("li");
          nestedItems.forEach((child) => {
            const el = child as HTMLElement;
            if (el === liElement) return;
            if (nextCollapsed) {
              el.classList.add("collapsed-block");
            } else {
              el.classList.remove("collapsed-block");
            }
          });
          return;
        }
      }

      // 3) Progress pill editor (band just to the right of the collapse gutter)
      if (clickX <= liRect.left + COLLAPSE_GUTTER_PX) {
        // Not a top-level list item; ignore special behavior
        return;
      }

      if (clickX > liRect.left + COLLAPSE_GUTTER_PX + 60) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const posInfo = editor.view.posAtCoords({
        left: liRect.left + 4,
        top: liRect.top + liRect.height / 2,
      });

      if (!posInfo) return;

      const { pos } = posInfo;
      const tr = state.tr.setSelection(
        TextSelection.near(state.doc.resolve(pos), -1)
      );
      view.dispatch(tr);

      const { $from } = editor.state.selection;
      const itemTypes = ["listItem", "taskItem"];
      let currentValue = 0;
      let currentDuration = 0;

      for (let d = $from.depth; d > 0; d -= 1) {
        const node = $from.node(d) as any;
        if (itemTypes.includes(node.type.name)) {
          const p = node.attrs?.progress;
          const dur = node.attrs?.durationMinutes;
          if (typeof p === "number") {
            currentValue = p;
          }
          if (typeof dur === "number") {
            currentDuration = dur;
          }
          break;
        }
      }

      setProgressEditor({
        value: currentValue,
        durationMinutes: currentDuration,
        pos,
      });
    },
    [editor]
  );

  const handleProgressChange = useCallback(
    (value: number) => {
      setProgressEditor((prev) =>
        prev ? { ...prev, value: Math.max(0, Math.min(100, value)) } : prev
      );
    },
    []
  );

  const handleDurationChange = useCallback((value: number) => {
    setProgressEditor((prev) =>
      prev
        ? {
            ...prev,
            durationMinutes: Math.max(0, Math.min(24 * 60, value)),
          }
        : prev
    );
  }, []);

  const handleProgressSave = useCallback(() => {
    if (!editor || !progressEditor) return;

    const clamped = Math.max(0, Math.min(100, progressEditor.value));
    const duration =
      progressEditor.durationMinutes <= 0
        ? null
        : Math.max(1, Math.min(24 * 60, progressEditor.durationMinutes));

    editor.chain().focus()
      .command(({ tr, state, dispatch }) => {
        const $pos = state.doc.resolve(progressEditor.pos);
        const itemTypes = ["listItem", "taskItem"];
        let depth = -1;

        for (let d = $pos.depth; d > 0; d -= 1) {
          const node = $pos.node(d);
          if (itemTypes.includes(node.type.name)) {
            depth = d;
            break;
          }
        }

        if (depth === -1) {
          return false;
        }

        const node = $pos.node(depth);
        const nodePos = $pos.before(depth);

        const newAttrs = {
          ...node.attrs,
          progress: clamped,
          durationMinutes: duration,
        };

        if (dispatch) {
          dispatch(tr.setNodeMarkup(nodePos, node.type, newAttrs));
        }
        return true;
      })
      .run();

    setProgressEditor(null);
  }, [editor, progressEditor]);

  const handleProgressCancel = useCallback(() => {
    setProgressEditor(null);
  }, []);

  const canUndo = editor?.can().undo() || false;
  const canRedo = editor?.can().redo() || false;

  if (!activeSubTab || activeSubTabId === "done-log") {
    return null;
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-shrink-0 z-10 bg-[var(--bg-color)]">
        <Toolbar
          editor={editor}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pb-16 sm:pb-0">
        <div className={hideCompleted ? "hide-completed-tasks" : ""}>
          <EditorContent editor={editor} onClick={handleEditorClick} />
        </div>
      </div>
      <QuickFormatBar editor={editor} />
      {editor && progressEditor && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
          <div className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg shadow-lg p-4 w-72 max-w-[90vw]">
            <div className="mb-3 font-semibold text-sm">
              Set item progress
            </div>
            <div className="space-y-3 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--placeholder-color)]">
                  Progress
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={progressEditor.value}
                  onChange={(e) =>
                    handleProgressChange(Number(e.target.value || 0))
                  }
                  className="w-20 px-2 py-1 border border-[var(--border-color)] rounded text-sm bg-[var(--bg-color)]"
                />
                <span className="text-sm text-[var(--placeholder-color)]">
                  %
                </span>
                <div className="flex gap-1 ml-auto overflow-x-auto whitespace-nowrap max-w-[7rem]">
                  {[25, 50, 75, 100].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleProgressChange(v)}
                      className="px-2 py-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)]"
                    >
                      {v}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--placeholder-color)]">
                  Length
                </label>
                <input
                  type="number"
                  min={0}
                  max={24 * 60}
                  value={progressEditor.durationMinutes}
                  onChange={(e) =>
                    handleDurationChange(Number(e.target.value || 0))
                  }
                  className="w-24 px-2 py-1 border border-[var(--border-color)] rounded text-sm bg-[var(--bg-color)]"
                />
                <span className="text-sm text-[var(--placeholder-color)]">
                  min
                </span>
                <div className="flex gap-1 ml-auto overflow-x-auto whitespace-nowrap max-w-[7rem]">
                  {[15, 30, 60].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => handleDurationChange(v)}
                      className="px-2 py-1 text-xs border border-[var(--border-color)] rounded bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)]"
                    >
                      {v}m
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleProgressCancel}
                className="px-3 py-1 text-sm border border-[var(--border-color)] rounded bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProgressSave}
                className="px-3 py-1 text-sm rounded bg-[var(--accent-color)] text-white hover:opacity-90"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

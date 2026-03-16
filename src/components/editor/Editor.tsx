import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotesStore } from "../../store/notesStore";
import { LinkPopover } from "./LinkPopover";
import { QuickFormatBar } from "./QuickFormatBar";
import { Toolbar } from "./Toolbar";
import { SearchBar } from "./SearchBar";
import { moveListItem } from "./listItemReorder";
import { ListItemProgress } from "./listItemProgress";
import { TaskListDashInputRule } from "./taskListDashInputRule";

function extractCheckedTasks(doc: {
  descendants: (
    fn: (node: {
      type: { name: string };
      attrs?: Record<string, unknown>;
      textContent?: string;
    }) => boolean | void
  ) => void;
}): Map<string, boolean> {
  const tasks = new Map<string, boolean>();
  let idx = 0;
  doc.descendants((node) => {
    if (node.type.name === "taskItem") {
      const text = (node.textContent ?? "").trim();
      const checked = node.attrs?.checked === true;
      tasks.set(`${idx}:${text}`, checked);
      idx++;
    }
  });
  return tasks;
}

const collapsiblePluginKey = new PluginKey("collapsibleSections");

type CollapsibleState = {
  headings: number[];
  lists: number[];
  decorations: DecorationSet;
};

function hasNestedList(node: {
  descendants: (
    f: (n: { type: { name: string } }) => boolean | void
  ) => void;
}): boolean {
  let found = false;
  node.descendants((n) => {
    if (
      n.type.name === "bulletList" ||
      n.type.name === "orderedList" ||
      n.type.name === "taskList"
    ) {
      found = true;
      return false;
    }
  });
  return found;
}

const CollapsibleSections = Extension.create({
  name: "collapsibleSections",
  addProseMirrorPlugins() {
    return [
      new Plugin<CollapsibleState>({
        key: collapsiblePluginKey,
        props: {
          decorations(state) {
            return collapsiblePluginKey.getState(state)?.decorations || null;
          },
        },
        state: {
          init: () => ({
            headings: [],
            lists: [],
            decorations: DecorationSet.empty,
          }),
          apply(tr, value) {
            const doc = tr.doc;

            const mapPositions = (
              positions: number[],
              type: "heading" | "list"
            ) => {
              const mapped: number[] = [];
              for (const pos of positions) {
                const mappedPos = tr.mapping.map(pos, -1);
                if (type === "heading") {
                  const node = doc.nodeAt(mappedPos);
                  if (node?.type.name === "heading") mapped.push(mappedPos);
                } else {
                  const $pos = doc.resolve(mappedPos);
                  for (let d = $pos.depth; d > 0; d -= 1) {
                    const node = $pos.node(d);
                    if (
                      (node.type.name === "listItem" ||
                        node.type.name === "taskItem") &&
                      d === 2
                    ) {
                      const parent = $pos.node(1);
                      if (
                        ["bulletList", "orderedList", "taskList"].includes(
                          parent.type.name
                        ) &&
                        hasNestedList(node)
                      ) {
                        mapped.push($pos.before(d));
                      }
                      break;
                    }
                  }
                }
              }
              return mapped;
            };

            let headings = mapPositions(value.headings, "heading");
            let lists = mapPositions(value.lists, "list");

            const meta = tr.getMeta(collapsiblePluginKey) as
              | {
                  headingPos?: number;
                  listPos?: number;
                  setHeadings?: number[];
                  setLists?: number[];
                  initCollapsed?: boolean;
                }
              | undefined;

            // Default: all sections collapsed when tab is opened
            if (meta?.initCollapsed) {
              const allHeadings: number[] = [];
              const allLists: number[] = [];
              let offset = 0;
              for (let i = 0; i < doc.content.childCount; i++) {
                const child = doc.content.child(i);
                if (child.type.name === "heading") allHeadings.push(offset);
                if (
                  ["bulletList", "orderedList", "taskList"].includes(
                    child.type.name
                  )
                ) {
                  let itemOffset = offset + 1;
                  for (let j = 0; j < child.content.childCount; j++) {
                    const item = child.content.child(j);
                    if (
                      ["listItem", "taskItem"].includes(item.type.name) &&
                      hasNestedList(item)
                    ) {
                      allLists.push(itemOffset);
                    }
                    itemOffset += item.nodeSize;
                  }
                }
                offset += child.nodeSize;
              }
              headings = allHeadings;
              lists = allLists;
            }

            // Collapse-all / expand-all: set entire arrays at once
            if (meta?.setHeadings != null) headings = meta.setHeadings;
            if (meta?.setLists != null) lists = meta.setLists;

            // Single-item toggle
            if (meta?.headingPos != null) {
              const p = meta.headingPos;
              const idx = headings.indexOf(p);
              headings =
                idx >= 0
                  ? [...headings.slice(0, idx), ...headings.slice(idx + 1)]
                  : [...headings, p];
            }
            if (meta?.listPos != null) {
              const p = meta.listPos;
              const idx = lists.indexOf(p);
              lists =
                idx >= 0
                  ? [...lists.slice(0, idx), ...lists.slice(idx + 1)]
                  : [...lists, p];
            }

            const decorations: Decoration[] = [];
            const headingSet = new Set(headings);
            const listSet = new Set(lists);

            // Headings: collapse content until next heading of same or higher level
            doc.descendants((node, pos) => {
              if (node.type.name !== "heading" || !headingSet.has(pos))
                return true;
              const level = (node.attrs as { level?: number })?.level ?? 1;

              let sectionEnd = doc.content.size;
              let hiddenCount = 0;
              let offset = 0;
              for (let i = 0; i < doc.content.childCount; i++) {
                const child = doc.content.child(i);
                if (
                  offset > pos &&
                  child.type.name === "heading" &&
                  ((child.attrs as { level?: number })?.level ?? 1) <= level
                ) {
                  sectionEnd = offset;
                  break;
                }
                if (offset > pos) hiddenCount++;
                offset += child.nodeSize;
              }

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  "data-collapsed": "true",
                  "data-collapsed-count": String(hiddenCount),
                })
              );

              doc.nodesBetween(pos + node.nodeSize, sectionEnd, (n, p) => {
                if (n.isBlock) {
                  decorations.push(
                    Decoration.node(p, p + n.nodeSize, {
                      class: "collapsed-block",
                    })
                  );
                }
                return true;
              });
              return true;
            });

            // Lists: collapse nested items under top-level list item
            doc.descendants((node, pos) => {
              if (
                node.type.name !== "listItem" &&
                node.type.name !== "taskItem"
              )
                return true;
              if (!listSet.has(pos)) return true;

              const $pos = doc.resolve(pos);
              if ($pos.depth !== 2) return true;
              const parent = $pos.node(1);
              if (
                !["bulletList", "orderedList", "taskList"].includes(
                  parent.type.name
                )
              )
                return true;

              let hiddenItems = 0;
              doc.nodesBetween(pos, pos + node.nodeSize, (n, p) => {
                if (p === pos) return true;
                if (
                  n.type.name === "listItem" ||
                  n.type.name === "taskItem"
                ) {
                  hiddenItems++;
                  decorations.push(
                    Decoration.node(p, p + n.nodeSize, {
                      class: "collapsed-block",
                    })
                  );
                }
                return true;
              });

              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  "data-collapsed": "true",
                  "data-collapsed-count": String(hiddenItems),
                })
              );
              return true;
            });

            return {
              headings,
              lists,
              decorations: DecorationSet.create(doc, decorations),
            };
          },
        },
      }),
    ];
  },
});

export const Editor = () => {
  const mainTabs = useNotesStore((s) => s.mainTabs);
  const activeMainTabId = useNotesStore((s) => s.activeMainTabId);
  const activeSubTabId = useNotesStore((s) => s.activeSubTabId);
  const setActiveMainTab = useNotesStore((s) => s.setActiveMainTab);
  const setActiveSubTab = useNotesStore((s) => s.setActiveSubTab);
  const updateContent = useNotesStore((s) => s.updateContent);
  const hideCompleted = useNotesStore((s) => s.hideCompleted);
  const scrollPositions = useNotesStore((s) => s.scrollPositions);
  const setScrollPosition = useNotesStore((s) => s.setScrollPosition);

  const addCompletedTask = useNotesStore((s) => s.addCompletedTask);

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);
  const activeSubTab = activeMainTab?.subTabs.find(
    (st) => st.id === activeSubTabId
  );

  const prevCheckedRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (activeSubTabId === "done-log" || mainTabs.length === 0) return;
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

  const [searchOpen, setSearchOpen] = useState(false);
  const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer nofollow",
          class: "editor-link",
        },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      TaskListDashInputRule,
      Placeholder.configure({
        placeholder: "Start typing... (# heading, - list, -- task, > quote)",
      }),
      GlobalDragHandle.configure({
        excludedTags: ["p", "h1", "h2", "h3", "blockquote", "hr", "table"],
        dragHandleSelector: ".drag-handle",
      }),
      ListItemReorder,
      ListItemProgress,
      CollapsibleSections,
    ],
    content: activeSubTab?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg focus:outline-none min-h-full p-6",
      },
      transformPastedHTML(html) {
        return html;
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "f") {
            event.preventDefault();
            setSearchOpen(true);
            return true;
          }
          if ((event.metaKey || event.ctrlKey) && event.key === "k") {
            event.preventDefault();
            setLinkPopoverOpen(true);
            return true;
          }
          if (event.altKey && (event.key === "p" || event.key === "P")) {
            handleOpenProgressFromToolbar();
            event.preventDefault();
            return true;
          }
          // Collapse/expand at cursor: Cmd/Ctrl+Shift+[ or ]
          if (
            (event.metaKey || event.ctrlKey) &&
            event.shiftKey &&
            (event.key === "[" || event.key === "]")
          ) {
            const { state } = view;
            const { $from } = state.selection;
            const wantCollapse = event.key === "[";

            // Check if cursor is inside a heading
            for (let d = $from.depth; d >= 0; d--) {
              if ($from.node(d).type.name === "heading") {
                const headingPos = $from.before(d);
                const pluginState = collapsiblePluginKey.getState(
                  state
                ) as CollapsibleState | undefined;
                const isCollapsed =
                  pluginState?.headings.includes(headingPos) ?? false;
                if (
                  (wantCollapse && !isCollapsed) ||
                  (!wantCollapse && isCollapsed)
                ) {
                  event.preventDefault();
                  view.dispatch(
                    state.tr.setMeta(collapsiblePluginKey, {
                      headingPos,
                    })
                  );
                  return true;
                }
                return false;
              }
            }

            // Check if cursor is inside a top-level list item with nested lists
            for (let d = $from.depth; d > 0; d--) {
              const node = $from.node(d);
              if (
                ["listItem", "taskItem"].includes(node.type.name) &&
                d === 2
              ) {
                const parent = $from.node(1);
                if (
                  ["bulletList", "orderedList", "taskList"].includes(
                    parent.type.name
                  ) &&
                  hasNestedList(node)
                ) {
                  const listPos = $from.before(d);
                  const pluginState = collapsiblePluginKey.getState(
                    state
                  ) as CollapsibleState | undefined;
                  const isCollapsed =
                    pluginState?.lists.includes(listPos) ?? false;
                  if (
                    (wantCollapse && !isCollapsed) ||
                    (!wantCollapse && isCollapsed)
                  ) {
                    event.preventDefault();
                    view.dispatch(
                      state.tr.setMeta(collapsiblePluginKey, {
                        listPos,
                      })
                    );
                    return true;
                  }
                }
                return false;
              }
            }
            return false;
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (activeMainTab && activeSubTab) {
        updateContent(activeMainTab.id, activeSubTab.id, ed.getHTML());

        const currentTasks = extractCheckedTasks(ed.state.doc);
        const prev = prevCheckedRef.current;
        currentTasks.forEach((checked, key) => {
          if (checked && !prev.get(key)) {
            const text = key.replace(/^\d+:/, "");
            if (text) {
              addCompletedTask({
                id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                text,
                tabName: activeMainTab.name,
                subTabName: activeSubTab.name,
                completedAt: Date.now(),
              });
            }
          }
        });
        prevCheckedRef.current = currentTasks;
      }
    },
  });

  const prevSubTabIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (editor && activeSubTab) {
      if (editor.getHTML() !== activeSubTab.content) {
        editor.commands.setContent(activeSubTab.content);
      }
      prevCheckedRef.current = extractCheckedTasks(editor.state.doc);
      // Only collapse all when switching tabs, not on every content edit
      const tabJustSwitched = prevSubTabIdRef.current !== activeSubTab.id;
      prevSubTabIdRef.current = activeSubTab.id;
      if (tabJustSwitched) {
        editor.view.dispatch(
          editor.state.tr.setMeta(collapsiblePluginKey, { initCollapsed: true })
        );
      }
    }
  }, [editor, activeSubTab]);

  // ── Collapse/Expand handler ──────────────────────────────────────
  // Uses mousedown (fires before ProseMirror click handlers) and
  // DOM node comparison via view.nodeDOM() for bulletproof detection.
  const handleEditorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editor || e.button !== 0) return;
      const target = e.target as HTMLElement;
      const clickX = e.clientX;
      const { view, state } = editor;
      const gutter = window.innerWidth <= 640 ? 56 : 48;

      // 1) Heading collapse — match clicked heading to doc positions via DOM
      const headingEl = target.closest("h1, h2, h3") as HTMLElement | null;
      if (headingEl) {
        const rect = headingEl.getBoundingClientRect();
        if (clickX <= rect.left + gutter) {
          let offset = 0;
          for (let i = 0; i < state.doc.content.childCount; i++) {
            const child = state.doc.content.child(i);
            if (child.type.name === "heading") {
              try {
                const domNode = view.nodeDOM(offset);
                if (domNode === headingEl) {
                  e.preventDefault();
                  e.stopPropagation();
                  view.dispatch(
                    state.tr.setMeta(collapsiblePluginKey, {
                      headingPos: offset,
                    })
                  );
                  return;
                }
              } catch { /* nodeDOM can throw if view is updating */ }
            }
            offset += child.nodeSize;
          }
        }
        return;
      }

      // 2) List item collapse — match clicked li to top-level list items
      const liEl = target.closest("li") as HTMLElement | null;
      if (liEl) {
        const liRect = liEl.getBoundingClientRect();
        if (clickX <= liRect.left + gutter) {
          let offset = 0;
          for (let i = 0; i < state.doc.content.childCount; i++) {
            const child = state.doc.content.child(i);
            if (
              ["bulletList", "orderedList", "taskList"].includes(
                child.type.name
              )
            ) {
              let itemOffset = offset + 1;
              for (let j = 0; j < child.content.childCount; j++) {
                const item = child.content.child(j);
                if (
                  ["listItem", "taskItem"].includes(item.type.name) &&
                  hasNestedList(item)
                ) {
                  try {
                    const domNode = view.nodeDOM(itemOffset) as
                      | HTMLElement
                      | undefined;
                    if (domNode === liEl || domNode?.contains(liEl)) {
                      e.preventDefault();
                      e.stopPropagation();
                      view.dispatch(
                        state.tr.setMeta(collapsiblePluginKey, {
                          listPos: itemOffset,
                        })
                      );
                      return;
                    }
                  } catch { /* nodeDOM can throw if view is updating */ }
                }
                itemOffset += item.nodeSize;
              }
            }
            offset += child.nodeSize;
          }
        }
      }
    },
    [editor]
  );

  // ── Collapse All / Expand All ────────────────────────────────────
  const handleCollapseAll = useCallback(() => {
    if (!editor) return;
    const { view, state } = editor;
    const headingPositions: number[] = [];
    const listPositions: number[] = [];

    let offset = 0;
    for (let i = 0; i < state.doc.content.childCount; i++) {
      const child = state.doc.content.child(i);
      if (child.type.name === "heading") {
        headingPositions.push(offset);
      }
      if (
        ["bulletList", "orderedList", "taskList"].includes(child.type.name)
      ) {
        let itemOffset = offset + 1;
        for (let j = 0; j < child.content.childCount; j++) {
          const item = child.content.child(j);
          if (
            ["listItem", "taskItem"].includes(item.type.name) &&
            hasNestedList(item)
          ) {
            listPositions.push(itemOffset);
          }
          itemOffset += item.nodeSize;
        }
      }
      offset += child.nodeSize;
    }

    const pluginState = collapsiblePluginKey.getState(state) as
      | CollapsibleState
      | undefined;
    const allCollapsed =
      headingPositions.every((p) => pluginState?.headings.includes(p)) &&
      listPositions.every((p) => pluginState?.lists.includes(p));

    if (allCollapsed) {
      // Expand all — set both arrays to empty
      view.dispatch(
        state.tr.setMeta(collapsiblePluginKey, { setHeadings: [], setLists: [] })
      );
    } else {
      // Collapse all
      view.dispatch(
        state.tr.setMeta(collapsiblePluginKey, {
          setHeadings: headingPositions,
          setLists: listPositions,
        })
      );
    }
  }, [editor]);

  // ── Progress helpers ──────────────────────────────────────────────
  const handleOpenProgressFromToolbar = useCallback(() => {
    if (!editor) return;
    const { $from } = editor.state.selection;
    const itemTypes = ["listItem", "taskItem"];
    for (let d = $from.depth; d > 0; d--) {
      const node = $from.node(d) as {
        type: { name: string };
        attrs?: { progress?: number; durationMinutes?: number };
      };
      if (itemTypes.includes(node.type.name)) {
        setProgressEditor({
          value: (node.attrs?.progress as number) ?? 0,
          durationMinutes: (node.attrs?.durationMinutes as number) ?? 0,
          pos: $from.before(d),
        });
        return;
      }
    }
  }, [editor]);

  const handleProgressChange = useCallback((value: number) => {
    setProgressEditor((prev) =>
      prev ? { ...prev, value: Math.max(0, Math.min(100, value)) } : prev
    );
  }, []);

  const handleDurationChange = useCallback((value: number) => {
    setProgressEditor((prev) =>
      prev
        ? { ...prev, durationMinutes: Math.max(0, Math.min(24 * 60, value)) }
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

    editor
      .chain()
      .focus()
      .command(({ tr, state, dispatch }) => {
        const $pos = state.doc.resolve(progressEditor.pos);
        for (let d = $pos.depth; d > 0; d--) {
          const node = $pos.node(d);
          if (["listItem", "taskItem"].includes(node.type.name)) {
            if (dispatch) {
              dispatch(
                tr.setNodeMarkup($pos.before(d), node.type, {
                  ...node.attrs,
                  progress: clamped,
                  durationMinutes: duration,
                })
              );
            }
            return true;
          }
        }
        return false;
      })
      .run();
    setProgressEditor(null);
  }, [editor, progressEditor]);

  const progressInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (progressEditor && progressInputRef.current) {
      progressInputRef.current.focus();
      progressInputRef.current.select();
    }
  }, [progressEditor]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollKey = activeSubTab ? `${activeMainTabId}:${activeSubTab.id}` : "";

  // Save scroll position when switching away
  const prevScrollKeyRef = useRef(scrollKey);
  useEffect(() => {
    if (prevScrollKeyRef.current !== scrollKey && prevScrollKeyRef.current) {
      const el = scrollContainerRef.current;
      if (el) {
        setScrollPosition(prevScrollKeyRef.current, el.scrollTop);
      }
    }
    prevScrollKeyRef.current = scrollKey;
  }, [scrollKey, setScrollPosition]);

  // Restore scroll position when switching to a tab
  useEffect(() => {
    if (!scrollKey) return;
    const el = scrollContainerRef.current;
    if (!el) return;
    const saved = scrollPositions[scrollKey];
    requestAnimationFrame(() => {
      el.scrollTop = saved ?? 0;
    });
  }, [scrollKey]); // intentionally exclude scrollPositions to avoid re-triggering on save

  const canUndo = editor?.can().undo() || false;
  const canRedo = editor?.can().redo() || false;

  if (!activeSubTab || activeSubTabId === "done-log") return null;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-shrink-0 z-10 bg-[var(--bg-color)]">
        <Toolbar
          editor={editor}
          onUndo={() => editor?.chain().focus().undo().run()}
          onRedo={() => editor?.chain().focus().redo().run()}
          canUndo={canUndo}
          canRedo={canRedo}
          onSetProgress={handleOpenProgressFromToolbar}
          onSearch={() => setSearchOpen(true)}
          onCollapseAll={handleCollapseAll}
          onAddLink={() => setLinkPopoverOpen(true)}
        />
      </div>

      {searchOpen && editor && (
        <SearchBar editor={editor} onClose={() => setSearchOpen(false)} />
      )}

      {linkPopoverOpen && editor && (
        <LinkPopover
          editor={editor}
          onClose={() => setLinkPopoverOpen(false)}
        />
      )}

      <div ref={scrollContainerRef} className="flex-1 min-h-0 overflow-y-auto pb-16 sm:pb-0">
        <div
          className={hideCompleted ? "hide-completed-tasks" : ""}
          onMouseDownCapture={handleEditorMouseDown}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <QuickFormatBar
        editor={editor}
        onSetProgress={handleOpenProgressFromToolbar}
        onAddLink={() => setLinkPopoverOpen(true)}
      />

      {/* Progress modal */}
      {editor && progressEditor && (
        <div
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => setProgressEditor(null)}
        >
          <div
            className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-t-2xl sm:rounded-xl shadow-xl p-5 w-full sm:w-80 max-w-[100vw] sm:max-w-[90vw] animate-slide-up sm:animate-none"
            onClick={(ev) => ev.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">Set Progress</h3>
              <span className="text-[10px] text-[var(--placeholder-color)] bg-[var(--hover-bg-color)] px-2 py-0.5 rounded">
                Alt+P
              </span>
            </div>

            {/* Progress slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--placeholder-color)]">
                  Progress
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {progressEditor.value}%
                </span>
              </div>
              <input
                ref={progressInputRef}
                type="range"
                min={0}
                max={100}
                step={5}
                value={progressEditor.value}
                onChange={(e) => handleProgressChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[var(--accent-color)] bg-[var(--border-color)]"
              />
              <div className="flex gap-1.5 mt-2">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleProgressChange(v)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      progressEditor.value === v
                        ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                        : "border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)]"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-5">
              <span className="text-xs font-medium text-[var(--placeholder-color)] block mb-2">
                Duration (minutes)
              </span>
              <div className="flex gap-1.5">
                {[0, 15, 30, 60, 120].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleDurationChange(v)}
                    className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                      progressEditor.durationMinutes === v
                        ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                        : "border-[var(--border-color)] bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)]"
                    }`}
                  >
                    {v === 0 ? "—" : `${v}m`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setProgressEditor(null)}
                className="flex-1 px-3 py-2.5 text-sm border border-[var(--border-color)] rounded-lg bg-[var(--bg-color)] hover:bg-[var(--hover-bg-color)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProgressSave}
                className="flex-1 px-3 py-2.5 text-sm font-medium rounded-lg bg-[var(--accent-color)] text-white hover:bg-[var(--accent-hover)] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

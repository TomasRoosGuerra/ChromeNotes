import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import { Extension } from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNotesStore } from "../../store/notesStore";
import { LinkEditBubble } from "./LinkEditBubble";
import { LinkPopover } from "./LinkPopover";
import { QuickFormatBar } from "./QuickFormatBar";
import { NoteHeadingsOutline } from "./NoteHeadingsOutline";
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

/** Every list item / task item that contains a nested list (any depth). */
function collectCollapsibleListPositions(doc: PMNode): number[] {
  const out: number[] = [];
  doc.descendants((node, pos) => {
    if (
      (node.type.name === "listItem" || node.type.name === "taskItem") &&
      hasNestedList(node)
    ) {
      out.push(pos);
    }
  });
  return out;
}

/** After a mapped position, resolve the containing collapsible list item start, or null. */
function mapListCollapsePosition(doc: PMNode, mappedPos: number): number | null {
  const size = doc.content.size;
  const clamped = Math.max(0, Math.min(mappedPos, size));
  const $pos = doc.resolve(clamped);
  for (let d = $pos.depth; d > 0; d -= 1) {
    const node = $pos.node(d);
    if (
      (node.type.name === "listItem" || node.type.name === "taskItem") &&
      hasNestedList(node)
    ) {
      const parent = $pos.node(d - 1);
      if (
        ["bulletList", "orderedList", "taskList"].includes(parent.type.name)
      ) {
        return $pos.before(d);
      }
    }
  }
  return null;
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
                  const next = mapListCollapsePosition(doc, mappedPos);
                  if (next != null && !mapped.includes(next)) mapped.push(next);
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
              let offset = 0;
              for (let i = 0; i < doc.content.childCount; i++) {
                const child = doc.content.child(i);
                if (child.type.name === "heading") allHeadings.push(offset);
                offset += child.nodeSize;
              }
              headings = allHeadings;
              lists = collectCollapsibleListPositions(doc);
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

              let blockOffset = 0;
              for (let j = 0; j < doc.content.childCount; j++) {
                const block = doc.content.child(j);
                if (blockOffset > pos && blockOffset < sectionEnd) {
                  decorations.push(
                    Decoration.node(blockOffset, blockOffset + block.nodeSize, {
                      class: "collapsed-block",
                    })
                  );
                }
                blockOffset += block.nodeSize;
              }
              return true;
            });

            // Lists: collapse nested items under any list item (any depth) with nested lists
            doc.descendants((node, pos) => {
              if (
                node.type.name !== "listItem" &&
                node.type.name !== "taskItem"
              )
                return true;
              if (!listSet.has(pos)) return true;
              if (!hasNestedList(node)) return true;

              const $pos = doc.resolve(pos + 1);
              let ok = false;
              for (let d = $pos.depth; d > 0; d -= 1) {
                const n = $pos.node(d);
                if (
                  (n.type.name === "listItem" || n.type.name === "taskItem") &&
                  $pos.before(d) === pos
                ) {
                  const parent = $pos.node(d - 1);
                  if (
                    ["bulletList", "orderedList", "taskList"].includes(
                      parent.type.name
                    )
                  ) {
                    ok = true;
                  }
                  break;
                }
              }
              if (!ok) return true;

              let hiddenItems = 0;
              let childPos = pos + 1;
              for (let i = 0; i < node.content.childCount; i++) {
                const child = node.content.child(i);
                if (
                  ["bulletList", "orderedList", "taskList"].includes(
                    child.type.name
                  )
                ) {
                  decorations.push(
                    Decoration.node(childPos, childPos + child.nodeSize, {
                      class: "collapsed-block",
                    })
                  );
                  child.descendants((desc) => {
                    if (
                      desc.type.name === "listItem" ||
                      desc.type.name === "taskItem"
                    ) {
                      hiddenItems++;
                    }
                  });
                }
                childPos += child.nodeSize;
              }

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
  const showLineNumbers = useNotesStore((s) => s.showLineNumbers);
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

  const currentLinePluginKey = new PluginKey("currentLineHighlight");
  const CurrentLineHighlight = Extension.create({
    name: "currentLineHighlight",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: currentLinePluginKey,
          props: {
            decorations(state) {
              if (!useNotesStore.getState().highlightCurrentLine) {
                return DecorationSet.empty;
              }
              const { selection, doc } = state;
              if (!selection.empty) return DecorationSet.empty;
              const { $from } = selection;
              let depth = $from.depth;
              while (depth > 0 && $from.node(depth).isInline) depth--;
              const pos = depth > 0 ? $from.before(depth) : 0;
              const node = doc.nodeAt(pos);
              if (!node) return DecorationSet.empty;
              const deco = Decoration.node(pos, pos + node.nodeSize, {
                class: "current-line-active",
              });
              return DecorationSet.create(doc, [deco]);
            },
          },
        }),
      ];
    },
  });

  const ListItemReorder = Extension.create({
    name: "listItemReorder",
    addKeyboardShortcuts() {
      return {
        "Alt-ArrowUp": () => moveListItem(this.editor, "up"),
        "Alt-ArrowDown": () => moveListItem(this.editor, "down"),
      };
    },
  });

  const ZOOM_STEP = 10;
  const ZOOM_MIN = 50;
  const ZOOM_MAX = 200;
  const [zoomPercent, setZoomPercent] = useState<number>(() => {
    const saved = localStorage.getItem("cn-zoom");
    return saved ? Number(saved) : 100;
  });
  const applyZoom = useCallback((pct: number) => {
    const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, pct));
    setZoomPercent(clamped);
    localStorage.setItem("cn-zoom", String(clamped));
  }, []);
  const handleZoomIn = useCallback(
    () => applyZoom(zoomPercent + ZOOM_STEP),
    [zoomPercent, applyZoom]
  );
  const handleZoomOut = useCallback(
    () => applyZoom(zoomPercent - ZOOM_STEP),
    [zoomPercent, applyZoom]
  );
  useEffect(() => {
    const reset = () => applyZoom(100);
    window.addEventListener("editor-zoom-reset", reset);
    return () => window.removeEventListener("editor-zoom-reset", reset);
  }, [applyZoom]);

  const WIDTH_STEPS = [50, 65, 80, 100, 0] as const;
  const WIDTH_LABELS = ["Narrow", "Medium", "Comfortable", "Wide", "Full"] as const;
  const WIDTH_DEFAULT_IDX = 4;
  const [widthIdx, setWidthIdx] = useState<number>(() => {
    const saved = localStorage.getItem("cn-width");
    if (saved != null) {
      const n = Number(saved);
      if (n >= 0 && n < WIDTH_STEPS.length) return n;
    }
    return WIDTH_DEFAULT_IDX;
  });
  const applyWidth = useCallback((idx: number) => {
    const clamped = Math.max(0, Math.min(WIDTH_STEPS.length - 1, idx));
    setWidthIdx(clamped);
    localStorage.setItem("cn-width", String(clamped));
  }, []);
  const handleWidthNarrower = useCallback(
    () => applyWidth(widthIdx - 1),
    [widthIdx, applyWidth]
  );
  const handleWidthWider = useCallback(
    () => applyWidth(widthIdx + 1),
    [widthIdx, applyWidth]
  );
  const contentMaxWidth = WIDTH_STEPS[widthIdx] === 0 ? "none" : `${WIDTH_STEPS[widthIdx]}ch`;
  const contentWidthLabel = WIDTH_LABELS[widthIdx];

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
      CurrentLineHighlight,
    ],
    content: activeSubTab?.content || "",
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (
            (event.metaKey || event.ctrlKey) &&
            event.shiftKey &&
            (event.key === "l" || event.key === "L")
          ) {
            event.preventDefault();
            useNotesStore.getState().toggleLineNumbers();
            return true;
          }
          if (
            (event.metaKey || event.ctrlKey) &&
            event.shiftKey &&
            (event.key === "h" || event.key === "H")
          ) {
            event.preventDefault();
            useNotesStore.getState().toggleHighlightCurrentLine();
            return true;
          }
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

            // Innermost list item with nested lists (any depth): walk from deepest ancestor
            for (let d = $from.depth; d > 0; d--) {
              const node = $from.node(d);
              if (
                !["listItem", "taskItem"].includes(node.type.name) ||
                !hasNestedList(node)
              ) {
                continue;
              }
              const parent = $from.node(d - 1);
              if (
                !["bulletList", "orderedList", "taskList"].includes(
                  parent.type.name
                )
              ) {
                continue;
              }
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
              return false;
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
  const visitedTabsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (editor && activeSubTab) {
      if (editor.getHTML() !== activeSubTab.content) {
        editor.commands.setContent(activeSubTab.content);
      }
      prevCheckedRef.current = extractCheckedTasks(editor.state.doc);
      const tabJustSwitched = prevSubTabIdRef.current !== activeSubTab.id;
      prevSubTabIdRef.current = activeSubTab.id;
      if (tabJustSwitched && !visitedTabsRef.current.has(activeSubTab.id)) {
        visitedTabsRef.current.add(activeSubTab.id);
        editor.view.dispatch(
          editor.state.tr.setMeta(collapsiblePluginKey, { initCollapsed: true })
        );
      }
    }
  }, [editor, activeSubTab]);

  const didAutoFocusRef = useRef(false);
  useEffect(() => {
    if (!editor || !activeSubTab || didAutoFocusRef.current) return;
    didAutoFocusRef.current = true;
    const timer = setTimeout(() => {
      if (!editor.isFocused) editor.commands.focus("end");
    }, 120);
    return () => clearTimeout(timer);
  }, [editor, activeSubTab]);

  useEffect(() => {
    if (!editor) return;
    const onPrefs = () => {
      editor.view.dispatch(editor.state.tr);
    };
    window.addEventListener("cn-editor-prefs", onPrefs);
    return () => window.removeEventListener("cn-editor-prefs", onPrefs);
  }, [editor]);

  // ── Collapse/Expand handler ──────────────────────────────────────
  // Uses mousedown (fires before ProseMirror click handlers) and
  // DOM node comparison via view.nodeDOM() for bulletproof detection.
  const handleEditorMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!editor || e.button !== 0) return;
      const target = e.target as HTMLElement;
      const clickX = e.clientX;
      const { view, state } = editor;
      const baseGutter = window.innerWidth <= 640 ? 56 : 48;
      // Widen hit zone when line-number gutter is visible (CSS padding-left on .ProseMirror)
      const gutter =
        baseGutter + (showLineNumbers ? (window.innerWidth <= 640 ? 40 : 32) : 0);

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

      // 2) List item collapse — any nested depth with nested lists
      const liEl = target.closest("li") as HTMLElement | null;
      if (liEl) {
        const liRect = liEl.getBoundingClientRect();
        if (clickX <= liRect.left + gutter) {
          for (const itemOffset of collectCollapsibleListPositions(
            state.doc
          )) {
            try {
              const domNode = view.nodeDOM(itemOffset) as
                | HTMLElement
                | undefined;
              if (domNode === liEl) {
                e.preventDefault();
                e.stopPropagation();
                view.dispatch(
                  state.tr.setMeta(collapsiblePluginKey, {
                    listPos: itemOffset,
                  })
                );
                return;
              }
            } catch {
              /* nodeDOM can throw if view is updating */
            }
          }
        }
      }
    },
    [editor, showLineNumbers]
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
      offset += child.nodeSize;
    }
    listPositions.push(...collectCollapsibleListPositions(state.doc));

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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollContainerEl, setScrollContainerEl] = useState<HTMLDivElement | null>(
    null
  );
  const assignScrollContainer = useCallback((el: HTMLDivElement | null) => {
    scrollContainerRef.current = el;
    setScrollContainerEl(el);
  }, []);
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
          zoomPercent={zoomPercent}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          contentWidthLabel={contentWidthLabel}
          canNarrower={widthIdx > 0}
          canWider={widthIdx < WIDTH_STEPS.length - 1}
          onWidthNarrower={handleWidthNarrower}
          onWidthWider={handleWidthWider}
        />
        <NoteHeadingsOutline editor={editor} />
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

      <div
        ref={assignScrollContainer}
        className={`flex-1 min-h-0 overflow-y-auto pb-[max(4rem,env(safe-area-inset-bottom))] touch-pan-y overscroll-y-contain sm:pb-0 ${showLineNumbers ? "editor-line-numbers" : ""}`}
      >
        <div
          className={hideCompleted ? "hide-completed-tasks" : ""}
          onMouseDownCapture={handleEditorMouseDown}
          style={{
            fontSize: `${zoomPercent}%`,
            maxWidth: contentMaxWidth,
            margin: "0 auto",
            transition: "max-width 0.25s ease",
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {editor && (
        <LinkEditBubble
          editor={editor}
          onEditLink={() => setLinkPopoverOpen(true)}
          linkPopoverOpen={linkPopoverOpen}
          scrollContainerEl={scrollContainerEl}
        />
      )}

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

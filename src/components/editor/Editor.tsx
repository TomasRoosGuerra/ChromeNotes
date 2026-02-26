import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import GlobalDragHandle from "tiptap-extension-global-drag-handle";
import { Extension } from "@tiptap/core";
import { useCallback, useEffect } from "react";
import { useNotesStore } from "../../store/notesStore";
import { QuickFormatBar } from "./QuickFormatBar";
import { Toolbar } from "./Toolbar";
import { moveListItem } from "./listItemReorder";

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
          <EditorContent editor={editor} />
        </div>
      </div>
      <QuickFormatBar editor={editor} />
    </div>
  );
};

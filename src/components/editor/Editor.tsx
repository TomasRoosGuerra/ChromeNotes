import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect } from "react";
import { useNotesStore } from "../../store/notesStore";
import { Toolbar } from "./Toolbar";

export const Editor = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const updateContent = useNotesStore((state) => state.updateContent);

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);
  const activeSubTab = activeMainTab?.subTabs.find(
    (st) => st.id === activeSubTabId
  );

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: "Start typing... Try '# ', '- ', or '-. '",
      }),
    ],
    content: activeSubTab?.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl focus:outline-none min-h-full p-6",
      },
    },
    onUpdate: ({ editor }) => {
      if (activeMainTab && activeSubTab) {
        updateContent(activeMainTab.id, activeSubTab.id, editor.getHTML());
      }
    },
  });

  // Update editor content when tab changes
  useEffect(() => {
    if (editor && activeSubTab) {
      const currentContent = editor.getHTML();
      if (currentContent !== activeSubTab.content) {
        editor.commands.setContent(activeSubTab.content);
      }
    }
  }, [editor, activeSubTab]);

  // Undo/Redo handlers
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
    <>
      <Toolbar
        editor={editor}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />
      <div className="flex-grow overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </>
  );
};

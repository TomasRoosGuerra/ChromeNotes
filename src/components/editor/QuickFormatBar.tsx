import type { Editor } from "@tiptap/react";
import { FiBold, FiCheckSquare, FiItalic, FiList } from "react-icons/fi";
import { Button } from "../ui/Button";

interface QuickFormatBarProps {
  editor: Editor | null;
}

export const QuickFormatBar = ({ editor }: QuickFormatBarProps) => {
  if (!editor) return null;

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-color)] border-t border-[var(--border-color)] p-2 z-30 shadow-lg">
      <div className="flex items-center justify-around gap-2">
        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`flex-1 min-h-[48px] ${
            editor.isActive("bold") ? "bg-[var(--accent-color)] text-white" : ""
          }`}
          title="Bold"
        >
          <FiBold className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`flex-1 min-h-[48px] ${
            editor.isActive("italic")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Italic"
        >
          <FiItalic className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`flex-1 min-h-[48px] ${
            editor.isActive("bulletList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="List"
        >
          <FiList className="w-5 h-5" />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`flex-1 min-h-[48px] ${
            editor.isActive("taskList")
              ? "bg-[var(--accent-color)] text-white"
              : ""
          }`}
          title="Tasks"
        >
          <FiCheckSquare className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};


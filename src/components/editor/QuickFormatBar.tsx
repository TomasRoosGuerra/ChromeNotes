import type { Editor } from "@tiptap/react";
import {
  FiBold,
  FiCheckSquare,
  FiItalic,
  FiList,
  FiCornerDownLeft,
  FiCornerUpLeft,
} from "react-icons/fi";
import { Button } from "../ui/Button";

interface QuickFormatBarProps {
  editor: Editor | null;
}

export const QuickFormatBar = ({ editor }: QuickFormatBarProps) => {
  if (!editor) return null;

  const inTaskList = editor.isActive("taskList");
  const inBulletOrOrdered =
    editor.isActive("bulletList") || editor.isActive("orderedList");
  const inList = inTaskList || inBulletOrOrdered;
  const listItemType = inTaskList ? "taskItem" : "listItem";
  const canSink = inList && editor.can().sinkListItem(listItemType);
  const canLift = inList && editor.can().liftListItem(listItemType);

  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 bg-[var(--bg-color)] border-t border-[var(--border-color)] p-2 z-30 shadow-lg safe-area-bottom">
      <div className="flex items-center justify-around gap-2">
        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().sinkListItem(listItemType).run()
          }
          disabled={!canSink}
          className={`flex-1 min-h-[48px] ${
            canSink ? "" : "opacity-50 pointer-events-none"
          }`}
          title="Indent (Tab)"
        >
          <FiCornerDownLeft className="w-5 h-5" aria-hidden />
        </Button>

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().liftListItem(listItemType).run()
          }
          disabled={!canLift}
          className={`flex-1 min-h-[48px] ${
            canLift ? "" : "opacity-50 pointer-events-none"
          }`}
          title="Outdent (Shift+Tab)"
        >
          <FiCornerUpLeft className="w-5 h-5" aria-hidden />
        </Button>

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


import type { Editor } from "@tiptap/react";
import { clsx } from "clsx";
import {
  FiAlignLeft,
  FiBold,
  FiCheckSquare,
  FiItalic,
  FiList,
  FiLogOut,
  FiRotateCcw,
  FiRotateCw,
  FiType,
} from "react-icons/fi";
import { MdFormatStrikethrough } from "react-icons/md";
import { useAuthStore } from "../../store/authStore";
import { Button } from "../ui/Button";
import { MoreOptionsMenu } from "../ui/MoreOptionsMenu";

interface ToolbarProps {
  editor: Editor | null;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const Toolbar = ({
  editor,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ToolbarProps) => {
  const signOut = useAuthStore((state) => state.signOut);
  const user = useAuthStore((state) => state.user);

  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)] overflow-x-auto">
      {/* Format Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={clsx(
            editor.isActive("bold") && "bg-[var(--accent-color)] text-white"
          )}
          title="Bold (Ctrl+B)"
        >
          <FiBold />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={clsx(
            editor.isActive("italic") && "bg-[var(--accent-color)] text-white"
          )}
          title="Italic (Ctrl+I)"
        >
          <FiItalic />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={clsx(
            editor.isActive("strike") && "bg-[var(--accent-color)] text-white"
          )}
          title="Strikethrough"
        >
          <MdFormatStrikethrough />
        </Button>

        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={clsx(
            editor.isActive("heading", { level: 1 }) &&
              "bg-[var(--accent-color)] text-white",
            "font-bold text-xs"
          )}
          title="Heading 1"
        >
          H1
        </Button>

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={clsx(
            editor.isActive("heading", { level: 2 }) &&
              "bg-[var(--accent-color)] text-white",
            "font-bold text-xs"
          )}
          title="Heading 2"
        >
          H2
        </Button>

        <Button
          size="sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={clsx(
            editor.isActive("heading", { level: 3 }) &&
              "bg-[var(--accent-color)] text-white",
            "font-bold text-xs"
          )}
          title="Heading 3"
        >
          H3
        </Button>

        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={clsx(
            editor.isActive("bulletList") &&
              "bg-[var(--accent-color)] text-white"
          )}
          title="Bullet List"
        >
          <FiList />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={clsx(
            editor.isActive("orderedList") &&
              "bg-[var(--accent-color)] text-white"
          )}
          title="Numbered List"
        >
          <FiType />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={clsx(
            editor.isActive("taskList") && "bg-[var(--accent-color)] text-white"
          )}
          title="Task List"
        >
          <FiCheckSquare />
        </Button>

        <Button
          size="sm"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={clsx(
            editor.isActive("blockquote") &&
              "bg-[var(--accent-color)] text-white"
          )}
          title="Blockquote"
        >
          <FiAlignLeft />
        </Button>

        <div className="w-px h-5 bg-[var(--border-color)] mx-1" />

        <Button
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <FiRotateCcw />
        </Button>

        <Button
          size="sm"
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <FiRotateCw />
        </Button>
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <MoreOptionsMenu />

        {user && (
          <span className="text-sm text-[var(--placeholder-color)] hidden md:block">
            {user.email}
          </span>
        )}

        <Button size="sm" onClick={signOut} title="Sign out">
          <FiLogOut />
        </Button>
      </div>
    </div>
  );
};

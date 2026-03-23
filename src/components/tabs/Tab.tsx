import { useCallback, useEffect, useRef, useState } from "react";
import { FiX } from "react-icons/fi";

interface TabProps {
  id: string;
  name: string;
  active: boolean;
  onSelect: () => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  showDelete?: boolean;
  hasContent?: boolean;
  title?: string;
  /** Enable drag-to-reorder (whole tab is draggable) */
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export const Tab = ({
  name,
  active,
  onSelect,
  onRename,
  onDelete,
  showDelete = true,
  hasContent = false,
  title: titleProp,
  draggable: isDraggable,
  onDragStart,
  onDragOver,
  onDrop,
}: TabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const commitRename = useCallback(() => {
    setIsEditing(false);
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== name && onRename) {
      onRename(trimmed);
    } else {
      setEditValue(name);
    }
  }, [editValue, name, onRename]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRename && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      setEditValue(name);
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div
      onClick={(e) => {
        if (isEditing) e.stopPropagation();
        else onSelect();
      }}
      onDoubleClick={handleDoubleClick}
      draggable={isDraggable && !isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="tab"
      aria-selected={active}
      aria-label={name}
      title={titleProp}
      className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-2.5 sm:py-1 rounded-lg cursor-pointer transition-all duration-200 touch-manipulation min-h-[36px] sm:min-h-0 flex-shrink-0 min-w-[5ch] ${
        isDraggable && !isEditing ? "cursor-grab active:cursor-grabbing" : ""
      } ${
        active
          ? "bg-[var(--accent-color)] text-white shadow-sm"
          : "bg-[var(--hover-bg-color)] hover:bg-[var(--border-color)]"
      }`}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitRename}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm sm:text-xs font-medium text-inherit placeholder:opacity-60"
          placeholder="Tab name"
        />
      ) : (
        <span className="text-sm sm:text-xs font-medium truncate block min-w-[5ch] max-w-full">
          {name}
        </span>
      )}
      {showDelete && onDelete && !isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const msg = hasContent
              ? `Delete "${name}"? This tab has content that will be lost.`
              : `Delete "${name}"?`;
            if (confirm(msg)) {
              onDelete();
            }
          }}
          className="p-1 sm:p-0.5 rounded hover:bg-black/10 touch-manipulation min-w-[24px] min-h-[24px] sm:min-w-0 sm:min-h-0 flex items-center justify-center transition-colors"
          aria-label={`Delete ${name}`}
        >
          <FiX className="w-4 h-4 sm:w-3 sm:h-3" />
        </button>
      )}
    </div>
  );
};

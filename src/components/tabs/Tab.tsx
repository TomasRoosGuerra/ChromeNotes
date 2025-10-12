import { FiX } from "react-icons/fi";

interface TabProps {
  id: string;
  name: string;
  active: boolean;
  onSelect: () => void;
  onRename?: (newName: string) => void;
  onDelete?: () => void;
  showDelete?: boolean;
}

export const Tab = ({
  name,
  active,
  onSelect,
  onRename,
  onDelete,
  showDelete = true,
}: TabProps) => {
  const handleDoubleClick = () => {
    if (onRename) {
      const newName = prompt("Enter new name:", name);
      if (newName && newName.trim()) {
        onRename(newName.trim());
      }
    }
  };

  return (
    <div
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      className={`flex items-center gap-2 px-4 py-2.5 sm:px-3 sm:py-2 rounded-lg cursor-pointer transition-colors touch-manipulation min-h-[44px] sm:min-h-0 ${
        active
          ? "bg-[var(--accent-color)] text-white shadow-md"
          : "bg-[var(--hover-bg-color)] hover:bg-[var(--border-color)]"
      }`}
    >
      <span className="text-base sm:text-sm font-medium whitespace-nowrap">
        {name}
      </span>
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${name}"?`)) {
              onDelete();
            }
          }}
          className="p-1.5 sm:p-0.5 rounded hover:bg-black/10 touch-manipulation min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
          aria-label={`Delete ${name}`}
        >
          <FiX className="w-4 h-4 sm:w-3 sm:h-3" />
        </button>
      )}
    </div>
  );
};

import { clsx } from "clsx";
import { FiX } from "react-icons/fi";

interface TabProps {
  id: string;
  name: string;
  active?: boolean;
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
    if (!onRename) return;

    const newName = prompt("Rename tab:", name);
    if (newName && newName.trim()) {
      onRename(newName.trim());
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all group",
        "border border-transparent whitespace-nowrap",
        active
          ? "bg-[var(--accent-color)] text-white"
          : "hover:bg-[var(--hover-bg-color)]"
      )}
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
    >
      <span className="select-none">{name}</span>
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={clsx(
            "hidden group-hover:block p-1 rounded-full transition-colors",
            active
              ? "hover:bg-white hover:bg-opacity-20"
              : "hover:bg-gray-300 dark:hover:bg-gray-700"
          )}
        >
          <FiX className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

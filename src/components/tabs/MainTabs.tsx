import { FiPlus } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { Tab } from "./Tab";

const TAB_DRAG_TYPE = "application/x-main-tab-index";

export const MainTabs = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const setActiveMainTab = useNotesStore((state) => state.setActiveMainTab);
  const addMainTab = useNotesStore((state) => state.addMainTab);
  const deleteMainTab = useNotesStore((state) => state.deleteMainTab);
  const renameMainTab = useNotesStore((state) => state.renameMainTab);
  const reorderMainTabs = useNotesStore((state) => state.reorderMainTabs);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData(TAB_DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = e.dataTransfer.getData(TAB_DRAG_TYPE);
    if (from === "") return;
    const fromIndex = parseInt(from, 10);
    if (!Number.isNaN(fromIndex)) reorderMainTabs(fromIndex, toIndex);
  };

  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)] min-w-0">
      <div className="flex gap-2 sm:gap-1 flex-grow min-w-0 overflow-x-auto overflow-y-hidden scrollbar-thin flex-nowrap">
        {mainTabs.map((tab, index) => (
          <Tab
            key={tab.id}
            id={tab.id}
            name={tab.name}
            active={tab.id === activeMainTabId}
            onSelect={() => setActiveMainTab(tab.id)}
            onRename={(newName) => renameMainTab(tab.id, newName)}
            onDelete={
              mainTabs.length > 1 ? () => deleteMainTab(tab.id) : undefined
            }
            showDelete={mainTabs.length > 1}
            draggable={mainTabs.length > 1}
            onDragStart={handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(index)}
          />
        ))}
      </div>
      <Button
        size="sm"
        onClick={addMainTab}
        title="Add main tab"
        className="flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
      >
        <FiPlus className="w-5 h-5 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
};

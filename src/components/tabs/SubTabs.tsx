import { FiPlus } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { Tab } from "./Tab";

const TAB_DRAG_TYPE = "application/x-sub-tab-index";

export const SubTabs = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const setActiveSubTab = useNotesStore((state) => state.setActiveSubTab);
  const addSubTab = useNotesStore((state) => state.addSubTab);
  const deleteSubTab = useNotesStore((state) => state.deleteSubTab);
  const renameSubTab = useNotesStore((state) => state.renameSubTab);
  const reorderSubTabs = useNotesStore((state) => state.reorderSubTabs);

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData(TAB_DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = e.dataTransfer.getData(TAB_DRAG_TYPE);
    if (from === "") return;
    const fromIndex = parseInt(from, 10);
    if (!Number.isNaN(fromIndex))
      reorderSubTabs(activeMainTab!.id, fromIndex, toIndex);
  };

  if (!activeMainTab || activeMainTab.mode === "planning") return null;

  const subTabs = activeMainTab.subTabs;
  const canReorder = subTabs.length > 1;

  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)] min-w-0">
      <div className="flex gap-2 sm:gap-1 flex-grow min-w-0 overflow-x-auto overflow-y-hidden scrollbar-thin flex-nowrap">
        {subTabs.map((subTab, index) => (
          <Tab
            key={subTab.id}
            id={subTab.id}
            name={subTab.name}
            active={subTab.id === activeSubTabId}
            onSelect={() => setActiveSubTab(subTab.id)}
            onRename={(newName) =>
              renameSubTab(activeMainTab.id, subTab.id, newName)
            }
            onDelete={
              subTabs.length > 1
                ? () => deleteSubTab(activeMainTab.id, subTab.id)
                : undefined
            }
            showDelete={subTabs.length > 1}
            draggable={canReorder}
            onDragStart={handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop(index)}
          />
        ))}
        <Tab
          id="done-log"
          name="Done"
          active={activeSubTabId === "done-log"}
          onSelect={() => setActiveSubTab("done-log")}
          showDelete={false}
        />
      </div>
      <Button
        size="sm"
        onClick={() => addSubTab(activeMainTab.id)}
        title="Add sub-tab"
        className="flex-shrink-0 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
      >
        <FiPlus className="w-5 h-5 sm:w-4 sm:h-4" />
      </Button>
    </div>
  );
};

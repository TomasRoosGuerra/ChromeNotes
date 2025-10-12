import { FiPlus } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { Tab } from "./Tab";

export const MainTabs = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const setActiveMainTab = useNotesStore((state) => state.setActiveMainTab);
  const addMainTab = useNotesStore((state) => state.addMainTab);
  const deleteMainTab = useNotesStore((state) => state.deleteMainTab);
  const renameMainTab = useNotesStore((state) => state.renameMainTab);

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)] overflow-x-auto scrollbar-thin">
      <div className="flex gap-1 flex-grow overflow-x-auto">
        {mainTabs.map((tab) => (
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
          />
        ))}
      </div>
      <Button
        size="sm"
        onClick={addMainTab}
        title="Add main tab"
        className="flex-shrink-0"
      >
        <FiPlus className="w-4 h-4" />
      </Button>
    </div>
  );
};

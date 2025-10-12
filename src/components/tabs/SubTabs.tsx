import { FiPlus } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { Tab } from "./Tab";

export const SubTabs = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const activeSubTabId = useNotesStore((state) => state.activeSubTabId);
  const setActiveSubTab = useNotesStore((state) => state.setActiveSubTab);
  const addSubTab = useNotesStore((state) => state.addSubTab);
  const deleteSubTab = useNotesStore((state) => state.deleteSubTab);
  const renameSubTab = useNotesStore((state) => state.renameSubTab);

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);

  if (!activeMainTab) return null;

  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-3 sm:py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)] overflow-x-auto">
      <div className="flex gap-2 sm:gap-1 flex-grow overflow-x-auto scrollbar-thin">
        {activeMainTab.subTabs.map((subTab) => (
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
              activeMainTab.subTabs.length > 1
                ? () => deleteSubTab(activeMainTab.id, subTab.id)
                : undefined
            }
            showDelete={activeMainTab.subTabs.length > 1}
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

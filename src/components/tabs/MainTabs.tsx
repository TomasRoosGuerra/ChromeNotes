import { FiPlus } from "react-icons/fi";
import { useEffect, useRef, useState, type PointerEventHandler } from "react";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { Tab } from "./Tab";

const TAB_DRAG_TYPE = "application/x-main-tab-index";

export const MainTabs = () => {
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const setActiveMainTab = useNotesStore((state) => state.setActiveMainTab);
  const addMainTab = useNotesStore((state) => state.addMainTab);
  const createPlanningTab = useNotesStore(
    (state) => state.createPlanningTab,
  );
  const deleteMainTab = useNotesStore((state) => state.deleteMainTab);
  const renameMainTab = useNotesStore((state) => state.renameMainTab);
  const reorderMainTabs = useNotesStore((state) => state.reorderMainTabs);

  const [isFabMenuOpen, setIsFabMenuOpen] = useState(false);
  const longPressTimeoutRef = useRef<number | null>(null);
  const longPressTriggeredRef = useRef(false);
  const fabMenuRef = useRef<HTMLDivElement | null>(null);

  const LONG_PRESS_MS = 500;

  useEffect(() => {
    if (!isFabMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (fabMenuRef.current?.contains(target)) return;
      setIsFabMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isFabMenuOpen]);

  const clearLongPressTimeout = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const handleFabPointerDown: PointerEventHandler<HTMLButtonElement> = (e) => {
    if (e.button !== 0) return; // only primary button / touch
    longPressTriggeredRef.current = false;
    clearLongPressTimeout();
    longPressTimeoutRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setIsFabMenuOpen(true);
    }, LONG_PRESS_MS);
  };

  const handleFabPointerUp: PointerEventHandler<HTMLButtonElement> = () => {
    if (!longPressTriggeredRef.current) {
      // Treat as regular tap -> add main notes tab
      addMainTab();
    }
    clearLongPressTimeout();
  };

  const handleFabPointerLeave: PointerEventHandler<HTMLButtonElement> = () => {
    clearLongPressTimeout();
  };

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
      <div className="relative flex-shrink-0" ref={fabMenuRef}>
        <Button
          size="sm"
          title="Add main tab"
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0"
          onPointerDown={handleFabPointerDown}
          onPointerUp={handleFabPointerUp}
          onPointerLeave={handleFabPointerLeave}
        >
          <FiPlus className="w-5 h-5 sm:w-4 sm:h-4" />
        </Button>
        {isFabMenuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[var(--bg-color)] border border-[var(--border-color)] shadow-xl z-30">
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg-color)]"
              onClick={() => {
                addMainTab();
                setIsFabMenuOpen(false);
              }}
            >
              New notes tab
            </button>
            <button
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--hover-bg-color)]"
              onClick={() => {
                createPlanningTab();
                setIsFabMenuOpen(false);
              }}
            >
              Create Planning Tab
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

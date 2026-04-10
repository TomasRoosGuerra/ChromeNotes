import { useEffect } from "react";
import { FiPlus, FiX } from "react-icons/fi";
import { useAppChrome } from "../../context/AppChromeContext";
import { useNotesStore } from "../../store/notesStore";
import { MoreOptionsMenu } from "../ui/MoreOptionsMenu";

const NAV_ITEM =
  "w-full text-left px-4 py-2 text-sm rounded-lg transition-colors touch-manipulation flex items-center gap-2";
const NAV_ACTIVE =
  "bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-medium";
const NAV_INACTIVE =
  "text-[var(--text-color)] hover:bg-[var(--hover-bg-color)]";

export const Sidebar = () => {
  const { sidebarOpen, setSidebarOpen } = useAppChrome();

  const mainTabs = useNotesStore((s) => s.mainTabs);
  const activeMainTabId = useNotesStore((s) => s.activeMainTabId);
  const setActiveMainTab = useNotesStore((s) => s.setActiveMainTab);
  const activeSubTabId = useNotesStore((s) => s.activeSubTabId);
  const setActiveSubTab = useNotesStore((s) => s.setActiveSubTab);
  const addMainTab = useNotesStore((s) => s.addMainTab);
  const createPlanningTab = useNotesStore((s) => s.createPlanningTab);
  const deleteMainTab = useNotesStore((s) => s.deleteMainTab);
  const addSubTab = useNotesStore((s) => s.addSubTab);

  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);
  const subTabs =
    activeMainTab && activeMainTab.mode !== "planning"
      ? activeMainTab.subTabs
      : [];

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sidebarOpen, setSidebarOpen]);

  if (!sidebarOpen) return null;

  const close = () => setSidebarOpen(false);

  const selectMainTab = (id: string) => {
    setActiveMainTab(id);
    close();
  };

  const selectSubTab = (id: string) => {
    setActiveSubTab(id);
    close();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-30 sidebar-backdrop-enter"
        onClick={close}
        aria-hidden
      />

      {/* Panel */}
      <nav
        className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-[var(--bg-color)] border-r border-[var(--border-color)] z-40 flex flex-col sidebar-slide-enter safe-area-top"
        aria-label="Navigation sidebar"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-color)] flex-shrink-0">
          <span className="text-sm font-semibold text-[var(--text-color)]">
            Notebooks
          </span>
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-[var(--hover-bg-color)] text-[var(--text-color)] touch-manipulation"
            aria-label="Close sidebar"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable tab list */}
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {mainTabs.map((tab) => (
            <div key={tab.id} className="group relative">
              <button
                type="button"
                onClick={() => selectMainTab(tab.id)}
                className={`${NAV_ITEM} ${
                  tab.id === activeMainTabId ? NAV_ACTIVE : NAV_INACTIVE
                }`}
              >
                <span className="truncate">{tab.name}</span>
                {tab.mode === "planning" && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-medium shrink-0">
                    Plan
                  </span>
                )}
              </button>
              {mainTabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete tab "${tab.name}"?`)) {
                      deleteMainTab(tab.id);
                    }
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 p-1 rounded text-[var(--placeholder-color)] hover:text-red-500 transition-opacity"
                  aria-label={`Delete ${tab.name}`}
                  title={`Delete ${tab.name}`}
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* Sub tabs for active main tab (non-planning) */}
          {subTabs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
              <div className="px-3 mb-1 text-[10px] uppercase tracking-wider text-[var(--placeholder-color)]">
                Pages
              </div>
              {subTabs.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => selectSubTab(sub.id)}
                  className={`${NAV_ITEM} pl-6 ${
                    sub.id === activeSubTabId ? NAV_ACTIVE : NAV_INACTIVE
                  }`}
                >
                  <span className="truncate block">{sub.name}</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => selectSubTab("done-log")}
                className={`${NAV_ITEM} pl-6 ${
                  activeSubTabId === "done-log" ? NAV_ACTIVE : NAV_INACTIVE
                }`}
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  addSubTab(activeMainTab!.id);
                  close();
                }}
                className={`${NAV_ITEM} pl-6 text-[var(--placeholder-color)] flex items-center gap-1.5`}
              >
                <FiPlus className="w-3.5 h-3.5" /> Add page
              </button>
            </div>
          )}
        </div>

        {/* Bottom: new tab actions */}
        <div className="border-t border-[var(--border-color)] px-3 py-2 space-y-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              addMainTab();
              close();
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--hover-bg-color)] text-[var(--text-color)] flex items-center gap-2 touch-manipulation"
          >
            <FiPlus className="w-4 h-4" /> New notes tab
          </button>
          <button
            type="button"
            onClick={() => {
              createPlanningTab();
              close();
            }}
            className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--hover-bg-color)] text-[var(--text-color)] flex items-center gap-2 touch-manipulation"
          >
            <FiPlus className="w-4 h-4" /> New planning tab
          </button>
        </div>

        {/* Footer: options */}
        <div className="border-t border-[var(--border-color)] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center flex-shrink-0">
          <MoreOptionsMenu />
        </div>
      </nav>
    </>
  );
};

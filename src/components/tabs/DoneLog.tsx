import { format } from "date-fns";
import { FiArrowLeft, FiCheck, FiTrash2, FiX } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";

export const DoneLog = () => {
  const completedTasks = useNotesStore((state) => state.completedTasks);
  const deleteCompletedTask = useNotesStore(
    (state) => state.deleteCompletedTask
  );
  const mainTabs = useNotesStore((state) => state.mainTabs);
  const activeMainTabId = useNotesStore((state) => state.activeMainTabId);
  const setActiveSubTab = useNotesStore((state) => state.setActiveSubTab);
  const activeMainTab = mainTabs.find((t) => t.id === activeMainTabId);
  const isPlanningParent = activeMainTab?.mode === "planning";

  const backButton = isPlanningParent ? (
    <button
      type="button"
      onClick={() => setActiveSubTab("")}
      className="flex items-center gap-1.5 px-3 py-2 mb-4 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-sm font-medium text-[var(--text-color)] hover:bg-[var(--border-color)] transition-colors"
    >
      <FiArrowLeft className="w-4 h-4" />
      Back to Schedule
    </button>
  ) : null;

  if (completedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        {backButton && <div className="self-start w-full px-4 pt-4">{backButton}</div>}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--hover-bg-color)] flex items-center justify-center mb-4 text-[var(--placeholder-color)]">
            <FiCheck className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <p className="text-[var(--text-color)] font-medium mb-1">No completed tasks yet</p>
          <p className="text-sm text-[var(--placeholder-color)] mb-4">
            Check off tasks in your notes or planning to see them here
          </p>
          <div className="text-xs text-[var(--placeholder-color)] bg-[var(--hover-bg-color)] rounded-lg px-4 py-3 max-w-xs">
            <p className="font-medium text-[var(--text-color)] mb-1">Quick tip</p>
            <p>Type <kbd className="px-1 py-0.5 rounded bg-[var(--border-color)] text-[10px] font-mono">[]</kbd> + Space to create a task list, then check items off to track them here.</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedTasks = [...completedTasks].sort(
    (a, b) => b.completedAt - a.completedAt
  );

  const handleClearAll = () => {
    if (confirm(`Clear all ${completedTasks.length} completed tasks? This cannot be undone.`)) {
      completedTasks.forEach((t) => deleteCompletedTask(t.id));
    }
  };

  const groupedByTab = sortedTasks.reduce((acc, task) => {
    if (!acc[task.tabName]) {
      acc[task.tabName] = [];
    }
    acc[task.tabName].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  return (
    <div className="p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        {backButton || <div />}
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Clear all completed tasks"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
          Clear all ({completedTasks.length})
        </button>
      </div>
      {Object.entries(groupedByTab).map(([tabName, tasks]) => (
        <div key={tabName} className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 pb-2 border-b-2 border-[var(--accent-color)] tracking-tight">
            {tabName}
          </h2>

          {Object.entries(
            tasks.reduce((acc, task) => {
              const date = format(task.completedAt, "MMMM d, yyyy");
              if (!acc[date]) {
                acc[date] = [];
              }
              acc[date].push(task);
              return acc;
            }, {} as Record<string, typeof tasks>)
          ).map(([date, dateTasks]) => (
            <div key={date} className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-[var(--text-color)]">
                {date}
              </h3>
              <div className="space-y-2 pl-2 sm:pl-4">
                {dateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 group hover:bg-[var(--hover-bg-color)] p-3 sm:p-2 rounded-lg touch-manipulation"
                  >
                    <FiCheck className="w-5 h-5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <span className="text-base sm:text-sm text-[var(--completed-text-color)] break-words block">
                        {task.text}
                      </span>
                      <span className="text-[10px] text-[var(--placeholder-color)]">
                        {format(task.completedAt, "h:mm a")} · {task.subTabName}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteCompletedTask(task.id)}
                      className="opacity-100 sm:opacity-0 group-hover:opacity-100 p-2 sm:p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-all touch-manipulation min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 flex items-center justify-center"
                      title="Delete task"
                      aria-label="Delete task"
                    >
                      <FiX className="w-5 h-5 sm:w-4 sm:h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

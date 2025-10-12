import { format } from "date-fns";
import { FiCheck, FiX } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";

export const DoneLog = () => {
  const completedTasks = useNotesStore((state) => state.completedTasks);
  const deleteCompletedTask = useNotesStore(
    (state) => state.deleteCompletedTask
  );

  if (completedTasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--placeholder-color)]">
        <p>No tasks completed yet.</p>
      </div>
    );
  }

  const groupedByTab = completedTasks.reduce((acc, task) => {
    if (!acc[task.tabName]) {
      acc[task.tabName] = [];
    }
    acc[task.tabName].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  return (
    <div className="p-4 sm:p-6 overflow-y-auto">
      {Object.entries(groupedByTab).map(([tabName, tasks]) => (
        <div key={tabName} className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 pb-2 border-b-2 border-[var(--accent-color)]">
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
                    <span className="flex-grow text-base sm:text-sm text-[var(--completed-text-color)] break-words">
                      {task.text}
                    </span>
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

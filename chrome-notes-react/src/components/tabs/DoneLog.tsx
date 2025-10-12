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

  // Group tasks by tab name
  const groupedByTab = completedTasks.reduce((acc, task) => {
    if (!acc[task.tabName]) {
      acc[task.tabName] = [];
    }
    acc[task.tabName].push(task);
    return acc;
  }, {} as Record<string, typeof completedTasks>);

  return (
    <div className="p-6 overflow-y-auto">
      {Object.entries(groupedByTab).map(([tabName, tasks]) => (
        <div key={tabName} className="mb-8">
          <h2 className="text-xl font-semibold mb-4 pb-2 border-b-2 border-[var(--accent-color)]">
            {tabName}
          </h2>

          {/* Group by date within tab */}
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
              <h3 className="font-semibold mb-2 text-[var(--text-color)]">
                {date}
              </h3>
              <div className="space-y-2 pl-4">
                {dateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 group hover:bg-[var(--hover-bg-color)] p-2 rounded"
                  >
                    <FiCheck className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="flex-grow text-[var(--completed-text-color)]">
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteCompletedTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-all"
                      title="Delete task"
                    >
                      <FiX className="w-4 h-4 text-red-600" />
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

import { useMemo } from "react";
import { useNotesStore } from "../../store/notesStore";
import { Button } from "../ui/Button";
import { computeSchedule, minutesToLabel } from "../../lib/planning";

const PLANNING_DRAG_TYPE = "application/x-planning-task-index";

export const PlanningTab = () => {
  const planning = useNotesStore((s) => s.planning);
  const setDayStart = useNotesStore((s) => s.setPlanningDayStart);
  const addTask = useNotesStore((s) => s.addPlanningTask);
  const updateTask = useNotesStore((s) => s.updatePlanningTask);
  const reorderTasks = useNotesStore((s) => s.reorderPlanningTasks);
  const deleteTask = useNotesStore((s) => s.deletePlanningTask);

  const scheduled = useMemo(() => computeSchedule(planning), [planning]);

  const handleDayStartChange = (value: string) => {
    const [h, m] = value.split(":").map((n) => parseInt(n, 10));
    if (Number.isNaN(h) || Number.isNaN(m)) return;
    setDayStart(h * 60 + m);
  };

  const formatDayStartValue = () => {
    const h = Math.floor(planning.dayStartMinutes / 60);
    const m = planning.dayStartMinutes % 60;
    const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
    return `${pad(h)}:${pad(m)}`;
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    e.dataTransfer.setData(PLANNING_DRAG_TYPE, String(index));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (toIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    const from = e.dataTransfer.getData(PLANNING_DRAG_TYPE);
    if (!from) return;
    const fromIndex = parseInt(from, 10);
    if (Number.isNaN(fromIndex)) return;
    reorderTasks(fromIndex, toIndex);
  };

  const nowMinutes = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();

  if (!scheduled.length) {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <header className="sticky top-0 z-10 bg-[var(--bg-color)] pb-3 border-b border-[var(--border-color)] mb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-[var(--placeholder-color)]">
                Start Day
              </p>
              <input
                type="time"
                value={formatDayStartValue()}
                onChange={(e) => handleDayStartChange(e.target.value)}
                className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-color)] text-base"
              />
            </div>
            <Button size="sm" onClick={addTask}>
              Add first task
            </Button>
          </div>
        </header>
        <p className="text-sm text-[var(--placeholder-color)]">
          Create your first task to start auto-scheduling your day.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <header className="sticky top-0 z-10 bg-[var(--bg-color)] pb-3 border-b border-[var(--border-color)] mb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-[var(--placeholder-color)]">
              Start Day
            </p>
            <input
              type="time"
              value={formatDayStartValue()}
              onChange={(e) => handleDayStartChange(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-color)] text-base"
            />
          </div>
          <Button size="sm" onClick={addTask}>
            Add task
          </Button>
        </div>
      </header>

      <div className="space-y-3">
        {scheduled.map((task, index) => {
          const duration =
            typeof task.durationMinutes === "number" && task.durationMinutes > 0
              ? task.durationMinutes
              : 15;
          const isPinned = task.pinnedStartMinutes !== null;
          const isOverdue = task.endMinutes <= nowMinutes;
          const isCurrent =
            task.startMinutes <= nowMinutes && nowMinutes < task.endMinutes;

          const timeLabel = `${minutesToLabel(
            task.startMinutes
          )} – ${minutesToLabel(task.endMinutes)}`;

          return (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 sm:p-2 rounded-xl border text-sm sm:text-xs ${
                isCurrent
                  ? "border-[var(--accent-color)] bg-[var(--accent-color)]/5"
                  : isOverdue
                  ? "border-red-400/60 bg-red-50"
                  : "border-[var(--border-color)] bg-[var(--hover-bg-color)]/40"
              }`}
              draggable
              onDragStart={handleDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop(index)}
            >
              <div className="flex flex-col items-start gap-1 min-w-[96px]">
                <span className="text-xs font-semibold text-[var(--text-color)]">
                  {timeLabel}
                </span>
                <span className="text-[11px] text-[var(--placeholder-color)]">
                  {duration} min
                </span>
                {task.overflowsDay && (
                  <span className="text-[11px] text-red-500">
                    Overflows day
                  </span>
                )}
                {task.collidesWithPrevious && (
                  <span className="text-[11px] text-red-500">
                    Overlaps previous
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) =>
                    updateTask(task.id, { title: e.target.value })
                  }
                  placeholder="Task title"
                  className="w-full px-2 py-1 rounded border border-[var(--border-color)] bg-white text-[var(--text-color)] text-sm"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-[var(--placeholder-color)]">
                    Duration
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={duration}
                      onChange={(e) =>
                        updateTask(task.id, {
                          durationMinutes: Number(e.target.value) || 0,
                        })
                      }
                      className="w-16 px-1 py-0.5 rounded border border-[var(--border-color)] bg-white text-[var(--text-color)] text-xs"
                    />
                    <span>min</span>
                  </label>

                  <label className="flex items-center gap-1 text-[11px] text-[var(--placeholder-color)]">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) =>
                        updateTask(task.id, {
                          pinnedStartMinutes: e.target.checked
                            ? task.startMinutes
                            : null,
                        })
                      }
                    />
                    Pin to time
                  </label>

                  {isPinned && (
                    <input
                      type="time"
                      value={(() => {
                        const m =
                          task.pinnedStartMinutes ?? planning.dayStartMinutes;
                        const h = Math.floor(m / 60);
                        const mm = m % 60;
                        const pad = (n: number) =>
                          n < 10 ? `0${n}` : String(n);
                        return `${pad(h)}:${pad(mm)}`;
                      })()}
                      onChange={(e) => {
                        const [h, m] = e.target.value
                          .split(":")
                          .map((n) => parseInt(n, 10));
                        if (Number.isNaN(h) || Number.isNaN(m)) return;
                        updateTask(task.id, {
                          pinnedStartMinutes: h * 60 + m,
                        });
                      }}
                      className="px-2 py-0.5 rounded border border-[var(--border-color)] bg-white text-[var(--text-color)] text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTask(task.id)}
                >
                  ✕
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


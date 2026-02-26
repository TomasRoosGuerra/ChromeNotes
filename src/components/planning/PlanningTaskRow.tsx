import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheckCircle, FiCircle, FiMove, FiTrash2 } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";
import type { PlanningTask } from "../../types/notes";
import { formatDurationMinutes, minutesToLabel, parseDuration } from "../../lib/duration";

interface PlanningTaskRowProps {
  task: PlanningTask;
  start: number;
  end: number;
  overflow: boolean;
  autoFocus?: boolean;
  onEnterNext: () => void;
  /** Drag-and-drop: when this row is being dragged */
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  /** Drop zone: when another task is dragged over this row */
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  /** For overdue styling: end < nowMinutes && !completed */
  nowMinutes?: number;
  /** Called when user deletes this task */
  onDelete?: (id: string) => void;
}

export const PlanningTaskRow = ({
  task,
  start,
  end,
  overflow,
  autoFocus = false,
  onEnterNext,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  nowMinutes,
  onDelete,
}: PlanningTaskRowProps) => {
  const isOverdue =
    nowMinutes != null && !task.completed && end < nowMinutes;
  const updateTask = useNotesStore((state) => state.updatePlanningTask);
  const deleteTask = useNotesStore((state) => state.deletePlanningTask);
  const [title, setTitle] = useState(task.title);
  const [durationInput, setDurationInput] = useState(
    formatDurationMinutes(task.durationMinutes),
  );
  const [usingDefaultDuration, setUsingDefaultDuration] = useState(
    task.durationMinutes === 15,
  );

  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [autoFocus]);

  useEffect(() => {
    setTitle(task.title);
    setDurationInput(formatDurationMinutes(task.durationMinutes));
  }, [task.title, task.durationMinutes]);

  const timeLabel = useMemo(
    () => `${minutesToLabel(start)} – ${minutesToLabel(end)}`,
    [start, end],
  );

  const handleToggleCompleted = () => {
    updateTask(task.id, { completed: !task.completed });
  };

  const handleDelete = () => {
    if (onDelete) onDelete(task.id);
    else deleteTask(task.id);
  };

  const handleEffortClick = () => {
    const next = ((task.effort % 3) + 1) as 1 | 2 | 3;
    updateTask(task.id, { effort: next });
  };

  const handleBenefitClick = () => {
    const next = ((task.benefit % 3) + 1) as 1 | 2 | 3;
    updateTask(task.id, { benefit: next });
  };

  const commitTitle = () => {
    if (title !== task.title) {
      updateTask(task.id, { title });
    }
  };

  const commitDuration = () => {
    const parsed = parseDuration(durationInput);
    if (parsed && parsed > 0) {
      setUsingDefaultDuration(false);
      if (parsed !== task.durationMinutes) {
        updateTask(task.id, { durationMinutes: parsed });
      }
    } else {
      // Fallback to 15m default
      setUsingDefaultDuration(true);
      if (task.durationMinutes !== 15) {
        updateTask(task.id, { durationMinutes: 15 });
      }
      setDurationInput(formatDurationMinutes(15));
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitTitle();
      commitDuration();
      onEnterNext();
    }
  };

  const effortDots = "●".repeat(task.effort).padEnd(3, "○");
  const benefitDots = "●".repeat(task.benefit).padEnd(3, "○");

  const handleRowDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/x-planning-task-id", task.id);
    e.dataTransfer.setData(
      "application/x-planning-task-duration",
      String(task.durationMinutes),
    );
    e.dataTransfer.effectAllowed = "move";
    onDragStart?.(e);
  };

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={handleRowDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`grid grid-cols-[auto_1fr_auto_auto] rounded-lg px-3 py-2 gap-2 text-sm transition-shadow ${
        overflow
          ? "bg-amber-500/10 dark:bg-amber-900/20 border-amber-500/50 dark:border-amber-600/50"
          : "bg-[var(--hover-bg-color)] border-[var(--border-color)]"
      } ${task.completed ? "opacity-60 line-through" : ""} ${
        isOverdue ? "opacity-80 border-amber-500/40 dark:border-amber-600/40 bg-amber-500/5 dark:bg-amber-900/15" : ""
      } border ${
        isDragging ? "opacity-90 scale-[1.02] shadow-xl ring-2 ring-[var(--accent-color)]/30" : ""
      }`}
    >
      {/* Column 1: drag handle, check, time (secondary) */}
      <div className="flex items-center gap-1.5 min-w-0">
        <div
          className="text-[var(--placeholder-color)] cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <FiMove className="w-4 h-4" aria-hidden />
        </div>
        <button
          type="button"
          onClick={handleToggleCompleted}
          className="text-[var(--placeholder-color)] flex-shrink-0 hover:text-[var(--text-color)]"
          aria-label={task.completed ? "Mark as not done" : "Mark as done"}
        >
          {task.completed ? (
            <FiCheckCircle className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          ) : (
            <FiCircle className="w-5 h-5" />
          )}
        </button>
        <div className="text-[11px] text-[var(--placeholder-color)] whitespace-nowrap truncate min-w-0">
          {timeLabel}
        </div>
      </div>

      {/* Column 2: title input (primary todo content) */}
      <div className="min-w-0 flex flex-col justify-center">
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={handleKeyDown}
          placeholder={usingDefaultDuration && !title ? "What are you doing? (15m default)" : "What are you doing?"}
          className="w-full min-w-0 bg-transparent border-none outline-none text-sm font-medium text-[var(--text-color)] placeholder:text-[var(--placeholder-color)]"
          aria-label="Task title"
        />
      </div>

      {/* Column 3: duration pill (secondary) */}
      <div className="flex items-center justify-end sm:justify-start min-w-0">
        <input
          type="text"
          value={durationInput}
          onChange={(e) => setDurationInput(e.target.value)}
          onBlur={commitDuration}
          onKeyDown={handleKeyDown}
          aria-label="Duration"
          className={`w-12 sm:w-14 px-1.5 py-0.5 rounded-lg bg-[var(--hover-bg-color)] border text-center text-[11px] text-[var(--text-color)] ${
            usingDefaultDuration ? "border-dashed border-[var(--border-color)] opacity-80" : "border-[var(--border-color)]"
          }`}
        />
      </div>

      {/* Column 4: effort, benefit, delete as direct actions */}
      <div className="flex items-center gap-1.5 text-xs text-[var(--placeholder-color)] justify-end min-w-0">
        <button
          type="button"
          onClick={handleEffortClick}
          className="px-1.5 py-0.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] flex-shrink-0"
          title="Effort (1–3)"
          aria-label={`Effort: ${task.effort} of 3`}
        >
          <span className="font-mono text-[10px]">{effortDots}</span>
        </button>
        <button
          type="button"
          onClick={handleBenefitClick}
          className="px-1.5 py-0.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] flex-shrink-0"
          title="Benefit / impact (1–3)"
          aria-label={`Benefit: ${task.benefit} of 3`}
        >
          <span className="font-mono text-[10px] text-emerald-500 dark:text-emerald-400">
            {benefitDots}
          </span>
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="p-1 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] flex-shrink-0 hover:opacity-80"
          title="Delete task"
          aria-label="Delete task"
        >
          <FiTrash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};


import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import { useNotesStore } from "../../store/notesStore";
import { formatDurationMinutes, minutesToLabel } from "../../lib/duration";
import {
  schedulePlanning,
  type ScheduledItem,
  type ScheduledItemTask,
} from "../../lib/planningEngine";
import { PlanningTaskRow } from "./PlanningTaskRow";

const PIXELS_PER_MINUTE = 1;

type DropTarget = {
  scheduledIndex: number;
  isGap: boolean;
  gapLength?: number;
  gapStart?: number;
};

export const PlanningView = () => {
  const planning = useNotesStore((state) => state.planning);
  const tasks = planning.tasks;
  const setStartMinutes = useNotesStore(
    (state) => state.setPlanningStartMinutes,
  );
  const setEndMinutes = useNotesStore(
    (state) => state.setPlanningEndMinutes,
  );
  const addTask = useNotesStore((state) => state.addPlanningTask);
  const updatePlanningTask = useNotesStore(
    (state) => state.updatePlanningTask,
  );
  const reorderPlanningTasks = useNotesStore(
    (state) => state.reorderPlanningTasks,
  );

  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isEditingStart, setIsEditingStart] = useState(false);
  const [isEditingEnd, setIsEditingEnd] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(() => {
    const h = Math.floor(planning.dayStartMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (planning.dayStartMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  });
  const [endTimeInput, setEndTimeInput] = useState(() => {
    const end = planning.dayEndMinutes;
    const h = Math.floor(end / 60) % 24;
    const m = end % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  });

  useEffect(() => {
    const h = Math.floor(planning.dayStartMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (planning.dayStartMinutes % 60).toString().padStart(2, "0");
    setStartTimeInput(`${h}:${m}`);
  }, [planning.dayStartMinutes]);
  useEffect(() => {
    const end = planning.dayEndMinutes;
    const h = Math.floor(end / 60) % 24;
    const m = end % 60;
    setEndTimeInput(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
  }, [planning.dayEndMinutes]);
  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [draggingDuration, setDraggingDuration] = useState(0);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [fillGapFor, setFillGapFor] = useState<{
    scheduledIndex: number;
    gapStart: number;
    gapLength: number;
  } | null>(null);
  const [completedSectionExpanded, setCompletedSectionExpanded] = useState(false);

  const [nowMinutes, setNowMinutes] = useState(
    () => new Date().getHours() * 60 + new Date().getMinutes(),
  );
  useEffect(() => {
    const id = setInterval(
      () =>
        setNowMinutes(
          () => new Date().getHours() * 60 + new Date().getMinutes(),
        ),
      60_000,
    );
    return () => clearInterval(id);
  }, []);

  // Ensure at least one planning row exists and is focused
  useEffect(() => {
    if (tasks.length === 0) {
      const id = addTask({
        title: "",
        durationMinutes: 15,
        fixedStartMinutes: null,
        effort: 2,
        benefit: 2,
        completed: false,
      });
      setFocusedTaskId(id);
    }
  }, [tasks.length, addTask]);

  const scheduled: ScheduledItem[] = useMemo(
    () =>
      schedulePlanning(
        planning.dayStartMinutes,
        tasks,
        planning.dayEndMinutes,
      ),
    [planning.dayStartMinutes, planning.dayEndMinutes, tasks],
  );

  const currentTimeInsertIndex = useMemo(() => {
    const i = scheduled.findIndex((item) => item.start > nowMinutes);
    return i < 0 ? scheduled.length : i;
  }, [scheduled, nowMinutes]);

  const collisionError =
    dropTarget?.isGap &&
    dropTarget.gapLength != null &&
    draggingDuration > dropTarget.gapLength
      ? `Won't fit: ${formatDurationMinutes(draggingDuration)} task in ${dropTarget.gapLength}m gap`
      : null;

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      const id = e.dataTransfer.getData("application/x-planning-task-id");
      const dur = e.dataTransfer.getData(
        "application/x-planning-task-duration",
      );
      if (id) {
        setDraggingTaskId(id);
        setDraggingDuration(Number(dur) || 15);
      }
    },
    [],
  );
  const handleDragEnd = useCallback(() => {
    setDraggingTaskId(null);
    setDraggingDuration(0);
    setDropTarget(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, scheduledIndex: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const item = scheduled[scheduledIndex];
      if (item.type === "gap") {
        const gapLength = item.end - item.start;
        setDropTarget({
          scheduledIndex,
          isGap: true,
          gapLength,
          gapStart: item.start,
        });
      } else {
        setDropTarget({ scheduledIndex, isGap: false });
      }
    },
    [scheduled],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, scheduledIndex: number) => {
      e.preventDefault();
      const taskId = e.dataTransfer.getData("application/x-planning-task-id");
      if (!taskId || !dropTarget) {
        handleDragEnd();
        return;
      }
      if (collisionError) {
        handleDragEnd();
        return;
      }
      const fromIndex = tasks.findIndex((t) => t.id === taskId);
      if (fromIndex < 0) {
        handleDragEnd();
        return;
      }
      const item = scheduled[scheduledIndex];
      let dropInsertTaskIndex: number;
      let fixToGapStart: number | null = null;
      if (item.type === "gap") {
        dropInsertTaskIndex = scheduled
          .slice(0, scheduledIndex)
          .filter((x): x is ScheduledItemTask => x.type === "task").length;
        fixToGapStart =
          item.start != null
            ? Math.round(item.start / 15) * 15
            : null;
      } else {
        dropInsertTaskIndex = scheduled
          .slice(0, scheduledIndex + 1)
          .filter((x): x is ScheduledItemTask => x.type === "task").length - 1;
      }
      let toIndex =
        fromIndex > dropInsertTaskIndex
          ? dropInsertTaskIndex
          : dropInsertTaskIndex - 1;
      if (toIndex < 0) toIndex = 0;
      if (fromIndex !== toIndex) {
        reorderPlanningTasks(fromIndex, toIndex);
      }
      if (fixToGapStart != null) {
        updatePlanningTask(taskId, { fixedStartMinutes: fixToGapStart });
      }
      handleDragEnd();
    },
    [
      dropTarget,
      collisionError,
      tasks,
      scheduled,
      reorderPlanningTasks,
      updatePlanningTask,
      handleDragEnd,
    ],
  );

  const handleConfirmStartTime = () => {
    const [hStr, mStr] = startTimeInput.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      setStartMinutes(h * 60 + m);
    }
    setIsEditingStart(false);
  };

  const handleConfirmEndTime = () => {
    const [hStr, mStr] = endTimeInput.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      setEndMinutes(h * 60 + m);
    }
    setIsEditingEnd(false);
  };

  const sessionLengthMinutes = useMemo(() => {
    const start = planning.dayStartMinutes;
    const end = planning.dayEndMinutes;
    if (end > start) return end - start;
    return 24 * 60 - start + end;
  }, [planning.dayStartMinutes, planning.dayEndMinutes]);

  const timelineTicks = useMemo(() => {
    const start = planning.dayStartMinutes;
    const end = planning.dayEndMinutes;
    const ticks: number[] = [];
    const endCap = end > start ? end : 24 * 60;
    for (let m = start; m <= endCap; m += 30) ticks.push(m);
    return ticks;
  }, [planning.dayStartMinutes, planning.dayEndMinutes]);

  const totalMinutes = useMemo(() => {
    const start = planning.dayStartMinutes;
    const end = planning.dayEndMinutes;
    if (end > start) return end - start;
    return 24 * 60 - start + end;
  }, [planning.dayStartMinutes, planning.dayEndMinutes]);

  const trackHeightPx = useMemo(
    () => Math.max(totalMinutes * PIXELS_PER_MINUTE, 400),
    [totalMinutes],
  );

  const handleEnterNextFromIndex = (index: number) => {
    const nextTask = scheduled
      .slice(index + 1)
      .find((i): i is ScheduledItemTask => i.type === "task");

    if (nextTask) {
      setFocusedTaskId(nextTask.id);
      return;
    }

    const id = addTask({
      title: "",
      durationMinutes: 15,
      fixedStartMinutes: null,
      effort: 2,
      benefit: 2,
      completed: false,
    });
    setFocusedTaskId(id);
  };

  const tasksThatFitInGap =
    fillGapFor != null
      ? scheduled
          .filter((item): item is ScheduledItemTask => {
            if (item.type !== "task") return false;
            const idx = scheduled.indexOf(item);
            return idx > fillGapFor.scheduledIndex && !item.task.completed;
          })
          .filter(
            (item) => item.task.durationMinutes <= fillGapFor.gapLength,
          )
      : [];

  const handleFillGapWithTask = (taskId: string) => {
    if (fillGapFor == null) return;
    const fromIndex = tasks.findIndex((t) => t.id === taskId);
    const dropInsertTaskIndex = scheduled
      .slice(0, fillGapFor.scheduledIndex)
      .filter((x): x is ScheduledItemTask => x.type === "task").length;
    const toIndex =
      fromIndex > dropInsertTaskIndex ? dropInsertTaskIndex : dropInsertTaskIndex - 1;
    const safeTo = Math.max(0, toIndex);
    if (fromIndex !== safeTo) reorderPlanningTasks(fromIndex, safeTo);
    const snapped = Math.round(fillGapFor.gapStart / 15) * 15;
    updatePlanningTask(taskId, { fixedStartMinutes: snapped });
    setFillGapFor(null);
  };

  const handleQuickAddInGap = (scheduledIndex: number, gapStart: number, gapLength: number) => {
    const snapped = Math.round(gapStart / 15) * 15;
    const id = addTask({
      title: "",
      durationMinutes: gapLength,
      fixedStartMinutes: snapped,
      effort: 2,
      benefit: 2,
      completed: false,
    });
    const insertIndex = scheduled
      .slice(0, scheduledIndex)
      .filter((x): x is ScheduledItemTask => x.type === "task").length;
    const fromIndex = tasks.length;
    if (fromIndex !== insertIndex) {
      reorderPlanningTasks(fromIndex, insertIndex);
    }
    setFocusedTaskId(id);
  };

  return (
    <div className="h-full bg-[var(--bg-color)] text-[var(--text-color)]">
      <div className="sticky top-0 z-10 px-4 py-2 border-b border-[var(--border-color)] bg-[var(--bg-color)]/95 backdrop-blur">
        {!isHeaderExpanded ? (
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs font-medium"
            onClick={() => setIsHeaderExpanded(true)}
            aria-expanded="false"
            aria-label="Edit day range"
          >
            {minutesToLabel(planning.dayStartMinutes)} – {minutesToLabel(planning.dayEndMinutes)}
            <span className="text-[var(--placeholder-color)] font-normal">
              {" "}
              · {formatDurationMinutes(sessionLengthMinutes)}
            </span>
          </button>
        ) : (
          <div className="space-y-2" aria-label="Day range editor">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase text-[var(--placeholder-color)]">Start</span>
                {isEditingStart ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="time"
                      value={startTimeInput}
                      onChange={(e) => setStartTimeInput(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs text-[var(--text-color)]"
                    />
                    <button
                      onClick={handleConfirmStartTime}
                      className="px-2 py-1.5 rounded-lg bg-[var(--accent-color)] text-xs font-semibold text-white"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <button
                    className="block w-full text-left mt-0.5 px-3 py-1.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs font-medium"
                    onClick={() => setIsEditingStart(true)}
                  >
                    {minutesToLabel(planning.dayStartMinutes)}
                  </button>
                )}
              </div>
              <div>
                <span className="text-[10px] uppercase text-[var(--placeholder-color)]">End</span>
                {isEditingEnd ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <input
                      type="time"
                      value={endTimeInput}
                      onChange={(e) => setEndTimeInput(e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs text-[var(--text-color)]"
                    />
                    <button
                      onClick={handleConfirmEndTime}
                      className="px-2 py-1.5 rounded-lg bg-[var(--accent-color)] text-xs font-semibold text-white"
                    >
                      Set
                    </button>
                  </div>
                ) : (
                  <button
                    className="block w-full text-left mt-0.5 px-3 py-1.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs font-medium"
                    onClick={() => setIsEditingEnd(true)}
                  >
                    {minutesToLabel(planning.dayEndMinutes)}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--placeholder-color)]">
                Session: {formatDurationMinutes(sessionLengthMinutes)}
              </span>
              <button
                type="button"
                className="px-2 py-1 rounded-lg bg-[var(--border-color)] text-xs font-medium text-[var(--text-color)]"
                onClick={() => {
                  setIsEditingStart(false);
                  setIsEditingEnd(false);
                  setIsHeaderExpanded(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Add task + column headers above the time track */}
      <div className="flex-shrink-0 px-3 py-2 space-y-2 border-b border-[var(--border-color)]">
        <button
          onClick={() =>
            setFocusedTaskId(
              addTask({
                title: "",
                durationMinutes: 15,
                fixedStartMinutes: null,
                effort: 2,
                benefit: 2,
                completed: false,
              }),
            )
          }
          className="w-full px-3 py-1.5 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-xs font-medium text-[var(--text-color)] flex items-center justify-center"
        >
          + Add task
        </button>
        <div
          className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto] gap-2 px-3 py-1.5 text-[11px] text-[var(--placeholder-color)] border-[var(--border-color)] whitespace-nowrap"
          role="row"
          aria-label="Column headers for schedule"
        >
          <span
            className="flex items-center min-w-0 truncate"
            role="columnheader"
            id="planning-col-time"
            title="Scheduled time block"
          >
            Time
          </span>
          <span
            className="min-w-0 truncate"
            role="columnheader"
            id="planning-col-task"
            title="Task name"
          >
            Task
          </span>
          <span
            className="flex items-center justify-end min-w-0 truncate"
            role="columnheader"
            id="planning-col-duration"
            title="Estimated duration"
          >
            Duration
          </span>
          <span
            className="flex items-center justify-end min-w-0 truncate"
            role="columnheader"
            id="planning-col-score"
            title="Effort and benefit score"
          >
            Score
          </span>
          <span className="flex items-center justify-end min-w-0">
            <button
              type="button"
              className="p-1 rounded-lg border border-[var(--border-color)] bg-[var(--hover-bg-color)] text-[10px]"
              title="Schedule options"
              aria-label="Schedule options"
            >
              ⋯
            </button>
          </span>
        </div>
      </div>

      {/* Single scroll container: timeline + track with time-scaled height */}
      <div className="flex min-h-0 flex-1 overflow-y-auto">
        <div
          className="flex-shrink-0 w-14 sm:w-16 border-r border-[var(--border-color)] relative text-[10px] sm:text-xs text-[var(--placeholder-color)]"
          style={{ height: trackHeightPx }}
        >
          {timelineTicks.map((mins) => {
            const topPx =
              (mins >= planning.dayStartMinutes
                ? mins - planning.dayStartMinutes
                : 24 * 60 - planning.dayStartMinutes + mins) * PIXELS_PER_MINUTE;
            const isHour = mins % 60 === 0;
            return (
              <div
                key={mins}
                className="absolute right-0 pr-1.5 border-b border-[var(--border-color)]/50 flex items-center justify-end"
                style={{ top: topPx, height: 20 }}
              >
                {isHour ? minutesToLabel(mins) : ""}
              </div>
            );
          })}
        </div>
        <div
          className="flex-1 min-w-0 relative px-3"
          style={{ height: trackHeightPx }}
        >
          {/* Now line: show when current time is within day range (same-day or overnight) */}
          {(() => {
            const inRange =
              planning.dayEndMinutes > planning.dayStartMinutes
                ? nowMinutes >= planning.dayStartMinutes && nowMinutes < planning.dayEndMinutes
                : nowMinutes >= planning.dayStartMinutes || nowMinutes < planning.dayEndMinutes;
            if (!inRange) return null;
            const nowTopPx =
              nowMinutes >= planning.dayStartMinutes
                ? (nowMinutes - planning.dayStartMinutes) * PIXELS_PER_MINUTE
                : (24 * 60 - planning.dayStartMinutes + nowMinutes) * PIXELS_PER_MINUTE;
            return (
              <div
                className="absolute left-0 right-0 flex items-center gap-2 border-t border-b border-[var(--accent-color)] bg-[var(--accent-color)]/10 z-10 pointer-events-none"
                style={{
                  top: nowTopPx,
                  height: 20,
                }}
              >
                <div className="w-1 h-3 rounded-full bg-[var(--accent-color)]" />
                <span className="text-[11px] font-semibold text-[var(--accent-color)]">
                  Now: {minutesToLabel(nowMinutes)}
                </span>
              </div>
            );
          })()}

          {/* End line at bottom */}
          <div
            className="absolute left-0 right-0 flex items-center gap-2 border-t border-[var(--accent-color)] bg-[var(--accent-color)]/10 z-10 pointer-events-none"
            style={{ top: trackHeightPx - 24, height: 24 }}
          >
            <div className="w-1 h-3 rounded-full bg-[var(--accent-color)]" />
            <span className="text-[11px] font-semibold text-[var(--accent-color)]">
              End: {minutesToLabel(planning.dayEndMinutes)}
            </span>
          </div>

          {/* Scheduled items: position by time, prevent visual overlap */}
          {(() => {
            let cursor = 0;
            const rowMinHeight = 56;

            return scheduled.map((item, index) => {
              const baseTop =
                (item.start >= planning.dayStartMinutes
                  ? item.start - planning.dayStartMinutes
                  : 24 * 60 - planning.dayStartMinutes + item.start) *
                PIXELS_PER_MINUTE;
              const durationHeight = Math.max(
                (item.end - item.start) * PIXELS_PER_MINUTE,
                1,
              );
              const visualHeight = Math.max(durationHeight, rowMinHeight);
              const top = Math.max(baseTop, cursor);
              const height = visualHeight;
              cursor = top + height + 2;

              if (item.type === "gap") {
                return (
                  <div
                    key={item.id}
                    className={`absolute left-0 right-0 rounded-lg border px-2 flex items-center justify-between gap-2 text-xs transition-colors ${
                      dropTarget?.scheduledIndex === index && collisionError
                        ? "bg-amber-500/10 dark:bg-amber-900/30 border-amber-500/70 text-amber-800 dark:text-amber-200"
                        : dropTarget?.scheduledIndex === index
                          ? "bg-[var(--accent-color)]/10 border-[var(--accent-color)]/50 text-[var(--text-color)]"
                          : "bg-[var(--hover-bg-color)] border-[var(--border-color)] text-[var(--text-color)]"
                    }`}
                    style={{
                      top,
                      height,
                    }}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-medium">
                      {minutesToLabel(item.start)} – {minutesToLabel(item.end)}
                    </span>
                    <span className="text-[var(--placeholder-color)]">
                      {" "}
                      · {item.end - item.start}m free
                    </span>
                    {dropTarget?.scheduledIndex === index && collisionError && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 ml-1 font-medium">
                        {collisionError}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickAddInGap(index, item.start, item.end - item.start)
                      }
                      className="px-2 py-1 rounded-lg bg-[var(--accent-color)] text-[11px] font-semibold text-white"
                    >
                      + Add
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFillGapFor({
                          scheduledIndex: index,
                          gapStart: item.start,
                          gapLength: item.end - item.start,
                        });
                      }}
                      className="px-2 py-1 rounded-lg bg-[var(--border-color)] text-[11px] font-medium text-[var(--text-color)]"
                    >
                      Fill
                    </button>
                  </div>
                </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="absolute left-0 right-0 rounded-lg"
                  style={{
                    top,
                    height,
                  }}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                >
                  <PlanningTaskRow
                    task={item.task}
                    start={item.start}
                    end={item.end}
                    overflow={item.overflow}
                    nowMinutes={nowMinutes}
                    autoFocus={focusedTaskId === item.id}
                    onEnterNext={() => handleEnterNextFromIndex(index)}
                    isDragging={draggingTaskId === item.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                  />
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Completed section below the track */}
      <>
        {tasks.filter((t) => t.completed).length > 0 && (
          <div className="pt-2 mt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-[var(--hover-bg-color)] border border-[var(--border-color)] text-left"
              onClick={() =>
                setCompletedSectionExpanded((prev) => !prev)
              }
              aria-expanded={completedSectionExpanded}
              aria-label={
                completedSectionExpanded
                  ? "Collapse completed"
                  : "Expand completed"
              }
            >
              <span className="text-xs font-semibold text-[var(--placeholder-color)]">
                Completed ({tasks.filter((t) => t.completed).length})
              </span>
              <FiChevronDown
                className={`w-4 h-4 text-[var(--placeholder-color)] flex-shrink-0 transition-transform ${
                  completedSectionExpanded ? "rotate-180" : ""
                }`}
              />
            </button>
            {completedSectionExpanded && (
              <ul className="space-y-1 mt-2">
                {tasks
                  .filter((t) => t.completed)
                  .map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--hover-bg-color)] text-[var(--completed-text-color)] text-sm line-through"
                    >
                      <span className="flex-1 truncate">
                        {t.title || "(Untitled)"}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-[var(--placeholder-color)] hover:text-[var(--text-color)]"
                        onClick={() =>
                          updatePlanningTask(t.id, { completed: false })
                        }
                        aria-label="Mark not done"
                      >
                        Undo
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
        {fillGapFor != null && (
          <div
            key="fill-gap-picker"
            className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setFillGapFor(null)}
          >
            <div
              className="bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl p-4 max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-medium text-[var(--text-color)] mb-2">
                Move a task into this gap
              </div>
              {tasksThatFitInGap.length === 0 ? (
                <p className="text-xs text-[var(--placeholder-color)]">
                  No later tasks fit in this gap.
                </p>
              ) : (
                <ul className="space-y-1 max-h-48 overflow-y-auto">
                  {tasksThatFitInGap.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 rounded-lg bg-[var(--hover-bg-color)] hover:opacity-90 text-sm text-[var(--text-color)]"
                        onClick={() => handleFillGapWithTask(s.id)}
                      >
                        {s.task.title || "(Untitled)"} — {s.task.durationMinutes}m
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                className="mt-3 w-full py-2 rounded-lg bg-[var(--border-color)] text-xs text-[var(--text-color)]"
                onClick={() => setFillGapFor(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    </div>
  );
};


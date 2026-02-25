import { useEffect, useMemo, useState } from "react";
import { useNotesStore } from "../../store/notesStore";

interface ScheduledItemGap {
  type: "gap";
  id: string;
  start: number;
  end: number;
}

interface ScheduledItemTask {
  type: "task";
  id: string;
  start: number;
  end: number;
  overflow: boolean;
}

type ScheduledItem = ScheduledItemGap | ScheduledItemTask;

const MINUTES_PER_DAY = 24 * 60;

function minutesToLabel(mins: number): string {
  const clamped = ((mins % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayH = ((h + 11) % 12) + 1;
  return `${displayH.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")} ${suffix}`;
}

export const PlanningView = () => {
  const planning = useNotesStore((state) => state.planning);
  const tasks = planning.tasks;
  const setStartMinutes = useNotesStore(
    (state) => state.setPlanningStartMinutes,
  );
  const addTask = useNotesStore((state) => state.addPlanningTask);

  const [isEditingStart, setIsEditingStart] = useState(false);
  const [startTimeInput, setStartTimeInput] = useState(() => {
    const h = Math.floor(planning.dayStartMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (planning.dayStartMinutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  });

  useEffect(() => {
    const h = Math.floor(planning.dayStartMinutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (planning.dayStartMinutes % 60).toString().padStart(2, "0");
    setStartTimeInput(`${h}:${m}`);
  }, [planning.dayStartMinutes]);

  const scheduled: ScheduledItem[] = useMemo(() => {
    const items: ScheduledItem[] = [];
    let cursor = planning.dayStartMinutes;

    for (const task of tasks) {
      const fixedStart =
        typeof task.fixedStartMinutes === "number"
          ? task.fixedStartMinutes
          : null;

      if (fixedStart !== null && fixedStart > cursor) {
        items.push({
          type: "gap",
          id: `gap-${items.length}`,
          start: cursor,
          end: fixedStart,
        });
        cursor = fixedStart;
      } else if (fixedStart !== null) {
        cursor = fixedStart;
      }

      const start = cursor;
      const end = start + task.durationMinutes;
      const overflow = end > MINUTES_PER_DAY;

      items.push({
        type: "task",
        id: task.id,
        start,
        end,
        overflow,
      });

      cursor = end;
    }

    return items;
  }, [planning.dayStartMinutes, tasks]);

  const handleConfirmStartTime = () => {
    const [hStr, mStr] = startTimeInput.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (Number.isFinite(h) && Number.isFinite(m)) {
      setStartMinutes(h * 60 + m);
    }
    setIsEditingStart(false);
  };

  return (
    <div className="h-full bg-black text-white">
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-red-500/40 bg-black/90 backdrop-blur">
        {isEditingStart ? (
          <div className="flex items-center gap-3">
            <input
              type="time"
              value={startTimeInput}
              onChange={(e) => setStartTimeInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-sm text-white"
            />
            <button
              onClick={handleConfirmStartTime}
              className="px-3 py-2 rounded-full bg-blue-600 text-xs font-semibold"
            >
              Set
            </button>
          </div>
        ) : (
          <button
            className="px-4 py-2 rounded-full bg-zinc-800 border border-zinc-600 text-sm font-medium flex items-center justify-between w-full"
            onClick={() => setIsEditingStart(true)}
          >
            <span>Start Day</span>
            <span className="opacity-80">
              {minutesToLabel(planning.dayStartMinutes)}
            </span>
          </button>
        )}
      </div>
      <div className="px-4 py-2 text-xs text-red-400 font-medium border-b border-red-500/60 sticky top-[56px] z-10 bg-black/95">
        Current Time: {/* placeholder; live line can be added next */}
      </div>
      <div className="px-4 py-3 space-y-3 overflow-y-auto">
        <button
          onClick={() =>
            addTask({
              title: "New task",
              durationMinutes: 30,
              fixedStartMinutes: null,
              effort: 2,
              benefit: 2,
              completed: false,
            })
          }
          className="w-full mb-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-300 flex items-center justify-center"
        >
          + Add task (30m)
        </button>
        {scheduled.map((item) =>
          item.type === "gap" ? (
            <div
              key={item.id}
              className="rounded-xl bg-zinc-900 border border-zinc-700/80 px-4 py-3 flex items-center justify-between text-sm text-zinc-300"
            >
              <div>
                <div className="font-medium">
                  {minutesToLabel(item.start)} – {minutesToLabel(item.end)}
                </div>
                <div className="text-xs text-zinc-500">
                  {item.end - item.start}m Free Time
                </div>
              </div>
              <button className="px-3 py-1 rounded-full bg-blue-600 text-xs font-semibold">
                Fill gap
              </button>
            </div>
          ) : (
            <div
              key={item.id}
              className={`rounded-xl px-4 py-3 flex items-center justify-between text-sm ${
                item.overflow
                  ? "bg-red-900/40 border border-red-600/70"
                  : "bg-zinc-900 border border-zinc-700/80"
              }`}
            >
              <div>
                <div className="text-xs text-zinc-400">
                  {minutesToLabel(item.start)} –{" "}
                  <span
                    className={
                      item.overflow ? "text-red-400 font-semibold" : undefined
                    }
                  >
                    {minutesToLabel(item.end)}
                    {item.overflow ? " (+1 day)" : ""}
                  </span>
                </div>
                <div className="mt-1 font-medium">Planned Task</div>
              </div>
              <div className="text-xs text-zinc-400">
                {/** Duration in hours/minutes */}
                {item.end - item.start}m
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};


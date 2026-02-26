import type { PlanningTask } from "../types/notes";
import { MINUTES_PER_DAY } from "./duration";

export interface ScheduledItemGap {
  type: "gap";
  id: string;
  start: number;
  end: number;
}

export interface ScheduledItemTask {
  type: "task";
  id: string;
  task: PlanningTask;
  start: number;
  end: number;
  overflow: boolean;
}

export type ScheduledItem = ScheduledItemGap | ScheduledItemTask;

/**
 * Core \"water flow\" scheduling engine.
 *
 * Given a day start, day end, and ordered planning tasks, it:
 * - walks tasks top-to-bottom,
 * - inserts explicit Gap blocks before fixed tasks when there is free time,
 * - places fixed tasks at their fixedStartMinutes,
 * - cascades floating tasks immediately after the previous item,
 * - marks tasks that overflow past day end.
 */
export const schedulePlanning = (
  dayStartMinutes: number,
  tasks: PlanningTask[],
  dayEndMinutes: number = MINUTES_PER_DAY,
): ScheduledItem[] => {
  const items: ScheduledItem[] = [];
  let cursor = dayStartMinutes;
  const dayEnd = dayEndMinutes > dayStartMinutes ? dayEndMinutes : MINUTES_PER_DAY;

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
    const overflow = end > dayEnd;

    items.push({
      type: "task",
      id: task.id,
      task,
      start,
      end,
      overflow,
    });

    cursor = end;
  }

  return items;
};


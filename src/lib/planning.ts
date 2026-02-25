import type { PlanningState, PlanningTask } from "../types/notes";

export interface ScheduledTask extends PlanningTask {
  startMinutes: number;
  endMinutes: number;
  /** True if this task extends past midnight */
  overflowsDay: boolean;
  /** True if this task overlaps the previous one (collision) */
  collidesWithPrevious: boolean;
}

const MINUTES_IN_DAY = 24 * 60;

const DEFAULT_DURATION_MINUTES = 15;

export const minutesToLabel = (minutes: number): string => {
  const m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  const displayHour = ((h + 11) % 12) + 1;
  const pad = (n: number) => (n < 10 ? `0${n}` : String(n));
  return `${displayHour}:${pad(mm)} ${suffix}`;
};

export const computeSchedule = (planning: PlanningState): ScheduledTask[] => {
  const tasks = planning.tasks.slice();
  if (!tasks.length) return [];

  // Keep list order, but we will respect pinnedStartMinutes where present.
  let current = planning.dayStartMinutes;
  const scheduled: ScheduledTask[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const duration =
      typeof task.durationMinutes === "number" && task.durationMinutes > 0
        ? task.durationMinutes
        : DEFAULT_DURATION_MINUTES;

    const pinned = task.pinnedStartMinutes ?? null;
    const start = pinned !== null ? pinned : current;
    const end = start + duration;

    const previous = scheduled[scheduled.length - 1];
    const collidesWithPrevious =
      !!previous && start < previous.endMinutes && pinned !== null;

    scheduled.push({
      ...task,
      startMinutes: start,
      endMinutes: end,
      overflowsDay: end >= MINUTES_IN_DAY,
      collidesWithPrevious,
    });

    // Advance current only for floating tasks; pinned tasks don't push the "water" start
    if (pinned === null) {
      current = end;
    }
  }

  return scheduled;
};


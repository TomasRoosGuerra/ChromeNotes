export interface SubTab {
  id: string;
  name: string;
  content: string; // HTML from TipTap
}

export interface MainTab {
  id: string;
  name: string;
  subTabs: SubTab[];
}

export interface CompletedTask {
  id: string;
  text: string;
  tabName: string;
  subTabName: string;
  completedAt: number;
}

export type PlanningTaskId = string;

export interface PlanningTask {
  id: PlanningTaskId;
  title: string;
  durationMinutes: number;
  fixedStartMinutes: number | null; // minutes from midnight, if fixed
  effort: 1 | 2 | 3;
  benefit: 1 | 2 | 3;
  completed: boolean;
}

export interface PlanningState {
  dayStartMinutes: number; // minutes from midnight (e.g. 9 * 60)
  tasks: PlanningTask[];
}

export interface NotesState {
  mainTabs: MainTab[];
  activeMainTabId: string;
  activeSubTabId: string;
  completedTasks: CompletedTask[];
  hideCompleted: boolean;
  lastSelectedSubTabs: Record<string, string>;
  scrollPositions: Record<string, number>;
  // UI preferences
  showMainTabs: boolean;
  showSubTabs: boolean;
  planning: PlanningState;
}

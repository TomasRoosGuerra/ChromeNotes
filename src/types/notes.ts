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

// Auto-scheduling planning feature
export interface PlanningTask {
  id: string;
  title: string;
  /** Estimated duration in minutes (fallback used if missing) */
  durationMinutes?: number;
  /** Optional pinned start time in minutes from midnight (0–1439) */
  pinnedStartMinutes?: number | null;
  /** Optional qualitative metrics */
  effort?: number | null;
  benefit?: number | null;
}

export interface PlanningState {
  /** Day start time in minutes from midnight (e.g. 8:00 = 480) */
  dayStartMinutes: number;
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
  // Planning / auto-scheduling
  planning: PlanningState;
}

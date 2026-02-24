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
}

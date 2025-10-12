export interface SubTab {
  id: string;
  name: string;
  content: string;
}

export interface MainTab {
  id: string;
  name: string;
  subTabs: SubTab[];
}

export interface CompletedTask {
  id: string;
  text: string;
  completedAt: number;
  tabName: string;
}

export interface NotesState {
  mainTabs: MainTab[];
  activeMainTabId: string | null;
  activeSubTabId: string | null;
  completedTasks: CompletedTask[];
  hideCompleted: boolean;
  lastSelectedSubTabs: Record<string, string>;
  scrollPositions: Record<string, number>;
}

export interface UndoState {
  content: string;
  timestamp: number;
}

export interface EmailSchedule {
  id: string;
  time: string; // HH:mm format
  enabled: boolean;
  tabIds: string[]; // Which tabs to include
  createdAt: number;
}

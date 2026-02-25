import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { saveNotesToCloud } from "../lib/firestore";
import { saveToLocalStorage } from "../lib/localStorage";
import type { CompletedTask, NotesState, PlanningTask } from "../types/notes";

interface NotesActions {
  addMainTab: () => void;
  deleteMainTab: (id: string) => void;
  renameMainTab: (id: string, name: string) => void;
  setActiveMainTab: (id: string) => void;
  reorderMainTabs: (fromIndex: number, toIndex: number) => void;
  addSubTab: (mainTabId: string) => void;
  deleteSubTab: (mainTabId: string, subTabId: string) => void;
  renameSubTab: (mainTabId: string, subTabId: string, name: string) => void;
  setActiveSubTab: (id: string) => void;
  reorderSubTabs: (
    mainTabId: string,
    fromIndex: number,
    toIndex: number,
  ) => void;
  updateContent: (mainTabId: string, subTabId: string, content: string) => void;
  addCompletedTask: (task: CompletedTask) => void;
  deleteCompletedTask: (id: string) => void;
  toggleHideCompleted: () => void;
  toggleShowMainTabs: () => void;
  toggleShowSubTabs: () => void;
  // Planning tab actions
  setPlanningStartMinutes: (minutes: number) => void;
  addPlanningTask: (task: Omit<PlanningTask, "id">) => void;
  updatePlanningTask: (id: string, updates: Partial<PlanningTask>) => void;
  reorderPlanningTasks: (fromIndex: number, toIndex: number) => void;
  loadState: (state: NotesState) => void;
  getState: () => NotesState;
}

const initialState: NotesState = {
  mainTabs: [
    {
      id: "main-initial",
      name: "Notes",
      subTabs: [
        {
          id: "sub-initial",
          name: "Main",
          content: "",
        },
      ],
    },
  ],
  activeMainTabId: "main-initial",
  activeSubTabId: "sub-initial",
  completedTasks: [],
  hideCompleted: false,
  lastSelectedSubTabs: {},
  scrollPositions: {},
  showMainTabs: true,
  showSubTabs: true,
  planning: {
    dayStartMinutes: 9 * 60, // 09:00
    tasks: [],
  },
};

// Debounced cloud save to avoid excessive writes
let cloudSaveTimeout: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;
let isLoadingFromCloud = false;

const saveToCloudDebounced = (state: NotesState, userId: string | null) => {
  if (!userId || isLoadingFromCloud) return;

  if (cloudSaveTimeout) {
    clearTimeout(cloudSaveTimeout);
  }

  cloudSaveTimeout = setTimeout(() => {
    saveNotesToCloud(userId, state);
  }, 1000); // Wait 1 second after last change before saving to cloud
};

const saveState = (get: () => NotesState & NotesActions) => {
  const state = get();
  saveToLocalStorage(state);
  saveToCloudDebounced(state.getState(), currentUserId);
};

export const setUserId = (userId: string | null) => {
  currentUserId = userId;
};

export const setLoadingFromCloud = (loading: boolean) => {
  isLoadingFromCloud = loading;
};

export const useNotesStore = create<NotesState & NotesActions>()(
  immer((set, get) => ({
    ...initialState,

    addMainTab: () => {
      set((state) => {
        const newId = Date.now().toString();
        const newSubTabId = (Date.now() + 1).toString();

        state.mainTabs.push({
          id: newId,
          name: "New Tab",
          subTabs: [
            {
              id: newSubTabId,
              name: "Main",
              content: "",
            },
          ],
        });

        state.activeMainTabId = newId;
        state.activeSubTabId = newSubTabId;
      });
      saveState(get);
    },

    deleteMainTab: (id) => {
      set((state) => {
        if (state.mainTabs.length <= 1) return;

        const index = state.mainTabs.findIndex((t) => t.id === id);
        if (index === -1) return;

        state.mainTabs.splice(index, 1);

        if (state.activeMainTabId === id) {
          state.activeMainTabId = state.mainTabs[0].id;
          state.activeSubTabId = state.mainTabs[0].subTabs[0].id;
        }
      });
      saveState(get);
    },

    renameMainTab: (id, name) => {
      set((state) => {
        const tab = state.mainTabs.find((t) => t.id === id);
        if (tab) {
          tab.name = name;
        }
      });
      saveState(get);
    },

    setActiveMainTab: (id) => {
      set((state) => {
        if (state.activeMainTabId && state.activeSubTabId) {
          state.lastSelectedSubTabs[state.activeMainTabId] =
            state.activeSubTabId;
        }

        state.activeMainTabId = id;

        const mainTab = state.mainTabs.find((t) => t.id === id);
        if (mainTab) {
          const lastSubTabId = state.lastSelectedSubTabs[id];
          const subTabExists = mainTab.subTabs.find(
            (st) => st.id === lastSubTabId,
          );

          state.activeSubTabId = subTabExists
            ? lastSubTabId
            : mainTab.subTabs[0].id;
        }
      });
    },

    reorderMainTabs: (fromIndex, toIndex) => {
      set((state) => {
        if (fromIndex === toIndex) return;
        const item = state.mainTabs[fromIndex];
        state.mainTabs.splice(fromIndex, 1);
        state.mainTabs.splice(toIndex, 0, item);
      });
      saveState(get);
    },

    addSubTab: (mainTabId) => {
      set((state) => {
        const mainTab = state.mainTabs.find((t) => t.id === mainTabId);
        if (!mainTab) return;

        const newSubTabId = Date.now().toString();
        mainTab.subTabs.push({
          id: newSubTabId,
          name: "New Sub-tab",
          content: "",
        });

        state.activeSubTabId = newSubTabId;
      });
      saveState(get);
    },

    deleteSubTab: (mainTabId, subTabId) => {
      set((state) => {
        const mainTab = state.mainTabs.find((t) => t.id === mainTabId);
        if (!mainTab || mainTab.subTabs.length <= 1) return;

        const index = mainTab.subTabs.findIndex((st) => st.id === subTabId);
        if (index === -1) return;

        mainTab.subTabs.splice(index, 1);

        if (state.activeSubTabId === subTabId) {
          state.activeSubTabId = mainTab.subTabs[0].id;
        }
      });
      saveState(get);
    },

    renameSubTab: (mainTabId, subTabId, name) => {
      set((state) => {
        const mainTab = state.mainTabs.find((t) => t.id === mainTabId);
        if (!mainTab) return;

        const subTab = mainTab.subTabs.find((st) => st.id === subTabId);
        if (subTab) {
          subTab.name = name;
        }
      });
      saveState(get);
    },

    setActiveSubTab: (id) => {
      set((state) => {
        state.activeSubTabId = id;
      });
    },

    reorderSubTabs: (mainTabId, fromIndex, toIndex) => {
      set((state) => {
        const mainTab = state.mainTabs.find((t) => t.id === mainTabId);
        if (!mainTab || fromIndex === toIndex) return;
        const item = mainTab.subTabs[fromIndex];
        mainTab.subTabs.splice(fromIndex, 1);
        mainTab.subTabs.splice(toIndex, 0, item);
      });
      saveState(get);
    },

    updateContent: (mainTabId, subTabId, content) => {
      set((state) => {
        const mainTab = state.mainTabs.find((t) => t.id === mainTabId);
        if (!mainTab) return;

        const subTab = mainTab.subTabs.find((st) => st.id === subTabId);
        if (subTab) {
          subTab.content = content;
        }
      });
      saveState(get);
    },

    addCompletedTask: (task) => {
      set((state) => {
        state.completedTasks.push(task);
      });
      saveState(get);
    },

    deleteCompletedTask: (id) => {
      set((state) => {
        const index = state.completedTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          state.completedTasks.splice(index, 1);
        }
      });
      saveState(get);
    },

    toggleHideCompleted: () => {
      set((state) => {
        state.hideCompleted = !state.hideCompleted;
      });
      saveState(get);
    },

    toggleShowMainTabs: () => {
      set((state) => {
        state.showMainTabs = !state.showMainTabs;
      });
      saveState(get);
    },

    toggleShowSubTabs: () => {
      set((state) => {
        state.showSubTabs = !state.showSubTabs;
      });
      saveState(get);
    },

    setPlanningStartMinutes: (minutes) => {
      set((state) => {
        state.planning.dayStartMinutes = minutes;
      });
      saveState(get);
    },

    addPlanningTask: (task) => {
      set((state) => {
        const id = Date.now().toString();
        state.planning.tasks.push({
          id,
          ...task,
        });
      });
      saveState(get);
    },

    updatePlanningTask: (id, updates) => {
      set((state) => {
        const t = state.planning.tasks.find((task) => task.id === id);
        if (!t) return;
        Object.assign(t, updates);
      });
      saveState(get);
    },

    reorderPlanningTasks: (fromIndex, toIndex) => {
      set((state) => {
        const tasks = state.planning.tasks;
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          toIndex < 0 ||
          fromIndex >= tasks.length ||
          toIndex >= tasks.length
        ) {
          return;
        }
        const [item] = tasks.splice(fromIndex, 1);
        tasks.splice(toIndex, 0, item);
      });
      saveState(get);
    },

    loadState: (newState) => {
      set((state) => {
        state.mainTabs = newState.mainTabs ?? state.mainTabs;
        state.activeMainTabId =
          newState.activeMainTabId ?? state.activeMainTabId;
        state.activeSubTabId = newState.activeSubTabId ?? state.activeSubTabId;
        state.completedTasks = newState.completedTasks ?? state.completedTasks;
        state.hideCompleted = newState.hideCompleted ?? state.hideCompleted;
        state.lastSelectedSubTabs =
          newState.lastSelectedSubTabs ?? state.lastSelectedSubTabs;
        state.scrollPositions =
          newState.scrollPositions ?? state.scrollPositions;
        state.showMainTabs =
          newState.showMainTabs ??
          state.showMainTabs ??
          initialState.showMainTabs;
        state.showSubTabs =
          newState.showSubTabs ?? state.showSubTabs ?? initialState.showSubTabs;
        state.planning = newState.planning ?? state.planning ?? initialState.planning;

        // Ensure active ids point to existing tabs (fixes blank screen after login/sync)
        const mainTabs = state.mainTabs;
        if (!mainTabs?.length) {
          state.mainTabs = [...initialState.mainTabs];
          state.activeMainTabId = initialState.activeMainTabId;
          state.activeSubTabId = initialState.activeSubTabId;
          return;
        }
        const mainTab = mainTabs.find((t) => t.id === state.activeMainTabId);
        if (!mainTab) {
          state.activeMainTabId = mainTabs[0].id;
          state.activeSubTabId =
            mainTabs[0].subTabs[0]?.id ?? state.activeSubTabId;
        } else if (!mainTab.subTabs?.length) {
          state.activeSubTabId = state.activeSubTabId;
        } else {
          const subExists = mainTab.subTabs.some(
            (st) => st.id === state.activeSubTabId,
          );
          if (!subExists) {
            state.activeSubTabId = mainTab.subTabs[0].id;
          }
        }
      });
      saveState(get);
    },

    getState: () => {
      const state = get();
      return {
        mainTabs: state.mainTabs,
        activeMainTabId: state.activeMainTabId,
        activeSubTabId: state.activeSubTabId,
        completedTasks: state.completedTasks,
        hideCompleted: state.hideCompleted,
        lastSelectedSubTabs: state.lastSelectedSubTabs,
        scrollPositions: state.scrollPositions,
        showMainTabs: state.showMainTabs,
        showSubTabs: state.showSubTabs,
        planning: state.planning,
      };
    },
  })),
);

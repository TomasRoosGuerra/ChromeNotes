import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { saveToLocalStorage } from "../lib/localStorage";
import type { CompletedTask, NotesState } from "../types/notes";

interface NotesActions {
  addMainTab: () => void;
  deleteMainTab: (id: string) => void;
  renameMainTab: (id: string, name: string) => void;
  setActiveMainTab: (id: string) => void;
  addSubTab: (mainTabId: string) => void;
  deleteSubTab: (mainTabId: string, subTabId: string) => void;
  renameSubTab: (mainTabId: string, subTabId: string, name: string) => void;
  setActiveSubTab: (id: string) => void;
  updateContent: (mainTabId: string, subTabId: string, content: string) => void;
  addCompletedTask: (task: CompletedTask) => void;
  deleteCompletedTask: (id: string) => void;
  toggleHideCompleted: () => void;
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
      saveToLocalStorage(get());
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
      saveToLocalStorage(get());
    },

    renameMainTab: (id, name) => {
      set((state) => {
        const tab = state.mainTabs.find((t) => t.id === id);
        if (tab) {
          tab.name = name;
        }
      });
      saveToLocalStorage(get());
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
            (st) => st.id === lastSubTabId
          );

          state.activeSubTabId = subTabExists
            ? lastSubTabId
            : mainTab.subTabs[0].id;
        }
      });
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
      saveToLocalStorage(get());
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
      saveToLocalStorage(get());
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
      saveToLocalStorage(get());
    },

    setActiveSubTab: (id) => {
      set((state) => {
        state.activeSubTabId = id;
      });
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
      saveToLocalStorage(get());
    },

    addCompletedTask: (task) => {
      set((state) => {
        state.completedTasks.push(task);
      });
      saveToLocalStorage(get());
    },

    deleteCompletedTask: (id) => {
      set((state) => {
        const index = state.completedTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          state.completedTasks.splice(index, 1);
        }
      });
      saveToLocalStorage(get());
    },

    toggleHideCompleted: () => {
      set((state) => {
        state.hideCompleted = !state.hideCompleted;
      });
      saveToLocalStorage(get());
    },

    loadState: (newState) => {
      set(newState);
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
      };
    },
  }))
);

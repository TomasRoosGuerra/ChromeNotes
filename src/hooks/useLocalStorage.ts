import { useEffect } from "react";
import { loadFromLocalStorage } from "../lib/localStorage";
import { useNotesStore } from "../store/notesStore";

export const useLocalStorage = () => {
  const loadState = useNotesStore((state) => state.loadState);

  useEffect(() => {
    // Load from localStorage on mount
    const savedData = loadFromLocalStorage();
    if (savedData) {
      loadState(savedData);
    }
  }, [loadState]);
};

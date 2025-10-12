import { useEffect, useRef } from "react";
import { loadFromLocalStorage } from "../lib/localStorage";
import { useNotesStore } from "../store/notesStore";

export const useLocalStorage = () => {
  const loadState = useNotesStore((state) => state.loadState);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;

    const savedData = loadFromLocalStorage();
    if (savedData) {
      loadState(savedData);
      hasLoadedRef.current = true;
    } else {
      hasLoadedRef.current = true;
    }
  }, [loadState]);
};

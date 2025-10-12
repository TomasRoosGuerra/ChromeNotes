import { useEffect, useRef } from "react";
import { loadFromLocalStorage } from "../lib/localStorage";
import { useNotesStore } from "../store/notesStore";

export const useLocalStorage = () => {
  const loadState = useNotesStore((state) => state.loadState);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    // Load from localStorage on mount (only once)
    if (hasLoadedRef.current) return;

    console.log("Loading from localStorage...");
    const savedData = loadFromLocalStorage();
    if (savedData) {
      console.log("Found saved data, loading...");
      loadState(savedData);
      hasLoadedRef.current = true;
    } else {
      console.log("No saved data found");
      hasLoadedRef.current = true;
    }
  }, []); // No dependencies - only run once on mount
};

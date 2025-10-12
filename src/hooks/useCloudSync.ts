import { useCallback, useEffect, useRef } from "react";
import {
  loadNotesFromCloud,
  saveNotesToCloud,
  subscribeToCloudNotes,
} from "../lib/firestore";
import { useAuthStore } from "../store/authStore";
import { useNotesStore } from "../store/notesStore";

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!user || hasLoadedRef.current) return;

    const loadNotes = async () => {
      const cloudData = await loadNotesFromCloud(user.uid);
      if (cloudData) {
        useNotesStore.getState().loadState(cloudData);
        hasLoadedRef.current = true;
      }
    };

    loadNotes();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCloudNotes(user.uid, (cloudData) => {
      const currentState = useNotesStore.getState().getState();
      if (JSON.stringify(cloudData) !== JSON.stringify(currentState)) {
        useNotesStore.getState().loadState(cloudData);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const syncToCloud = useCallback(async () => {
    if (!user) return false;
    const currentState = useNotesStore.getState().getState();
    return await saveNotesToCloud(user.uid, currentState);
  }, [user]);

  return { syncToCloud };
};

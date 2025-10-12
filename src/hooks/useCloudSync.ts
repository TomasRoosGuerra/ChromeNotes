import { useCallback, useEffect } from "react";
import {
  loadNotesFromCloud,
  saveNotesToCloud,
  subscribeToCloudNotes,
} from "../lib/firestore";
import { useAuthStore } from "../store/authStore";
import { useNotesStore } from "../store/notesStore";

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const notesState = useNotesStore((state) => state.getState());
  const loadState = useNotesStore((state) => state.loadState);

  // Load notes when user signs in
  useEffect(() => {
    if (!user) return;

    const loadNotes = async () => {
      const cloudData = await loadNotesFromCloud(user.uid);
      if (cloudData) {
        loadState(cloudData);
      }
    };

    loadNotes();
  }, [user, loadState]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCloudNotes(user.uid, (cloudData) => {
      loadState(cloudData);
    });

    return unsubscribe;
  }, [user, loadState]);

  // Save to cloud
  const syncToCloud = useCallback(async () => {
    if (!user) return false;
    return await saveNotesToCloud(user.uid, notesState);
  }, [user, notesState]);

  return { syncToCloud };
};

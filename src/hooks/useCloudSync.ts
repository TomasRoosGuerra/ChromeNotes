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
  const loadState = useNotesStore((state) => state.loadState);
  const hasLoadedRef = useRef(false);

  // Load notes when user signs in (only once)
  useEffect(() => {
    if (!user || hasLoadedRef.current) return;

    const loadNotes = async () => {
      console.log("Loading notes from cloud for user:", user.uid);
      const cloudData = await loadNotesFromCloud(user.uid);
      if (cloudData) {
        loadState(cloudData);
        hasLoadedRef.current = true;
      }
    };

    loadNotes();
  }, [user]); // Remove loadState from dependencies

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    console.log("Subscribing to cloud updates for user:", user.uid);
    const unsubscribe = subscribeToCloudNotes(user.uid, (cloudData) => {
      console.log("Cloud data updated, merging...");
      loadState(cloudData);
    });

    return () => {
      console.log("Unsubscribing from cloud updates");
      unsubscribe();
    };
  }, [user]); // Remove loadState from dependencies

  // Save to cloud
  const syncToCloud = useCallback(async () => {
    if (!user) return false;
    const currentState = useNotesStore.getState().getState();
    return await saveNotesToCloud(user.uid, currentState);
  }, [user]);

  return { syncToCloud };
};

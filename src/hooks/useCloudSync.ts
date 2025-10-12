import { useCallback, useEffect, useRef } from "react";
import {
  loadNotesFromCloud,
  saveNotesToCloud,
  subscribeToCloudNotes,
} from "../lib/firestore";
import { useAuthStore } from "../store/authStore";
import { setLoadingFromCloud, useNotesStore } from "../store/notesStore";

export const useCloudSync = () => {
  const user = useAuthStore((state) => state.user);
  const hasLoadedRef = useRef(false);
  const isUpdatingFromCloudRef = useRef(false);

  useEffect(() => {
    if (!user || hasLoadedRef.current) return;

    const loadNotes = async () => {
      const cloudData = await loadNotesFromCloud(user.uid);
      if (cloudData) {
        isUpdatingFromCloudRef.current = true;
        setLoadingFromCloud(true);
        useNotesStore.getState().loadState(cloudData);
        hasLoadedRef.current = true;
        // Reset the flags after a short delay to allow the state to settle
        setTimeout(() => {
          isUpdatingFromCloudRef.current = false;
          setLoadingFromCloud(false);
        }, 100);
      }
    };

    loadNotes();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToCloudNotes(user.uid, (cloudData) => {
      // Prevent loading cloud data if we're currently syncing to cloud
      // This avoids race conditions
      if (isUpdatingFromCloudRef.current) return;

      const currentState = useNotesStore.getState().getState();
      if (JSON.stringify(cloudData) !== JSON.stringify(currentState)) {
        isUpdatingFromCloudRef.current = true;
        setLoadingFromCloud(true);
        useNotesStore.getState().loadState(cloudData);
        // Reset the flags after a short delay
        setTimeout(() => {
          isUpdatingFromCloudRef.current = false;
          setLoadingFromCloud(false);
        }, 100);
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

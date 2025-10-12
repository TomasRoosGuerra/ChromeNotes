import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import type { NotesState } from "../types/notes";
import { db } from "./firebase";

const COLLECTION = "userNotes";

export const saveNotesToCloud = async (
  userId: string,
  data: NotesState
): Promise<boolean> => {
  try {
    const docRef = doc(db, COLLECTION, userId);
    await setDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error("Error saving to cloud:", error);
    return false;
  }
};

export const loadNotesFromCloud = async (
  userId: string
): Promise<NotesState | null> => {
  try {
    const docRef = doc(db, COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const { updatedAt, ...notesData } = data;
      return notesData as NotesState;
    }
    return null;
  } catch (error) {
    console.error("Error loading from cloud:", error);
    return null;
  }
};

export const subscribeToCloudNotes = (
  userId: string,
  callback: (data: NotesState) => void
): (() => void) => {
  const docRef = doc(db, COLLECTION, userId);

  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const { updatedAt, ...notesData } = data;
        callback(notesData as NotesState);
      }
    },
    (error) => {
      console.error("Error subscribing to cloud notes:", error);
    }
  );
};

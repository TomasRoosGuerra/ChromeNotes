import { useCallback, useState } from "react";

interface UndoState {
  content: string;
  timestamp: number;
}

const MAX_UNDO_HISTORY = 20;

export const useUndoRedo = () => {
  const [undoStack, setUndoStack] = useState<UndoState[]>([]);
  const [redoStack, setRedoStack] = useState<UndoState[]>([]);

  const saveUndoState = useCallback((content: string) => {
    const undoState: UndoState = {
      content,
      timestamp: Date.now(),
    };

    setUndoStack((prev) => {
      const newStack = [...prev, undoState];
      if (newStack.length > MAX_UNDO_HISTORY) {
        newStack.shift();
      }
      return newStack;
    });

    // Clear redo stack when new action is performed
    setRedoStack([]);
  }, []);

  const undo = useCallback(
    (currentContent: string): string | null => {
      if (undoStack.length === 0) return null;

      const previousState = undoStack[undoStack.length - 1];

      // Save current state to redo stack
      setRedoStack((prev) => [
        ...prev,
        {
          content: currentContent,
          timestamp: Date.now(),
        },
      ]);

      // Remove from undo stack
      setUndoStack((prev) => prev.slice(0, -1));

      return previousState.content;
    },
    [undoStack]
  );

  const redo = useCallback((): string | null => {
    if (redoStack.length === 0) return null;

    const nextState = redoStack[redoStack.length - 1];

    // Save current state to undo stack
    setUndoStack((prev) => [
      ...prev,
      {
        content: nextState.content,
        timestamp: Date.now(),
      },
    ]);

    // Remove from redo stack
    setRedoStack((prev) => prev.slice(0, -1));

    return nextState.content;
  }, [redoStack]);

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const clearHistory = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    saveUndoState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
};

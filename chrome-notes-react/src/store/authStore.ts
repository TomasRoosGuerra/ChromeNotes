import {
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
} from "firebase/auth";
import { create } from "zustand";
import { auth, googleProvider } from "../lib/firebase";
import { User } from "../types/user";

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthActions {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  loading: true,
  error: null,

  signIn: async () => {
    try {
      set({ loading: true, error: null });
      const result = await signInWithPopup(auth, googleProvider);
      set({ user: result.user, loading: false });
    } catch (error: any) {
      console.error("Sign in error:", error);
      set({
        error: error.message || "Failed to sign in",
        loading: false,
      });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await firebaseSignOut(auth);
      set({ user: null, loading: false });
    } catch (error: any) {
      console.error("Sign out error:", error);
      set({
        error: error.message || "Failed to sign out",
        loading: false,
      });
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  initAuth: () => {
    onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
    });
  },
}));

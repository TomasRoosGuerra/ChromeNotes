import { User as FirebaseUser } from "firebase/auth";

export type User = FirebaseUser;

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

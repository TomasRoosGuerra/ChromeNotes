import { FiLogIn } from "react-icons/fi";
import { useAuthStore } from "../../store/authStore";

export const SignInScreen = () => {
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)] p-4">
      <div className="text-center bg-[var(--bg-color)] p-10 sm:p-12 rounded-2xl border border-[var(--border-color)] shadow-xl max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <img
            src="/favicon.svg"
            alt=""
            className="w-16 h-16 rounded-xl"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-[var(--text-color)] tracking-tight">
          SpontaNotes
        </h1>
        <p className="text-[var(--placeholder-color)] mb-8 text-sm sm:text-base">
          Capture thoughts the moment they happen
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-400 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={signIn}
          className="flex items-center justify-center gap-3 w-full px-6 py-3.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white font-medium rounded-xl transition-all duration-200 active:scale-[0.98]"
        >
          <FiLogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

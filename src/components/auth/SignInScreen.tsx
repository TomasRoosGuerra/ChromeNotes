import { FiLogIn } from "react-icons/fi";
import { useAuthStore } from "../../store/authStore";

export const SignInScreen = () => {
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--bg-color)] p-4">
      <div className="text-center bg-[var(--bg-color)] p-10 sm:p-12 rounded-2xl border border-[var(--border-color)] shadow-xl max-w-md w-full">
        <div className="mb-6 flex justify-center">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold mb-2 text-[var(--text-color)] tracking-tight">
          Chrome Notes
        </h1>
        <p className="text-[var(--placeholder-color)] mb-8 text-sm sm:text-base">
          Your notes, synced across devices
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

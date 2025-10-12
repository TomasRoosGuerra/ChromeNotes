import { FiLogIn } from "react-icons/fi";
import { useAuthStore } from "../../store/authStore";

export const SignInScreen = () => {
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-500 to-blue-700">
      <div className="text-center bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl max-w-md w-full mx-4">
        {/* Logo/Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
          Chrome Notes
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Access your notes from anywhere
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 rounded-lg text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={signIn}
          className="flex items-center justify-center gap-3 w-full px-6 py-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all duration-200 hover:-translate-y-0.5 shadow-lg hover:shadow-xl"
        >
          <FiLogIn className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

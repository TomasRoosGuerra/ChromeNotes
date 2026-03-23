export const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-color)]">
      <img src="/favicon.svg" alt="" className="w-12 h-12 rounded-lg mb-4" />
      <div className="w-10 h-10 border-2 border-[var(--border-color)] border-t-[var(--accent-color)] rounded-full animate-spin mb-4" />
      <p className="text-[var(--placeholder-color)] text-sm">Loading...</p>
    </div>
  );
};

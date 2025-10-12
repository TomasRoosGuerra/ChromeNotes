export const LoadingScreen = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-color)]">
      <div className="w-10 h-10 border-4 border-[var(--border-color)] border-t-[var(--accent-color)] rounded-full animate-spin mb-4" />
      <p className="text-[var(--text-color)]">Loading Chrome Notes...</p>
    </div>
  );
};

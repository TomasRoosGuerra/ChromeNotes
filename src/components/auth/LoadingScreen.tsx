export const LoadingScreen = () => {
  console.log("LoadingScreen rendered");
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-900">Loading Chrome Notes...</p>
    </div>
  );
};

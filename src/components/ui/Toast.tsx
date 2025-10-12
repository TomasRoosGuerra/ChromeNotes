import { Toaster } from "react-hot-toast";

export const ToastContainer = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--bg-color)",
          color: "var(--text-color)",
          border: "1px solid var(--border-color)",
        },
        success: {
          iconTheme: {
            primary: "var(--accent-color)",
            secondary: "white",
          },
        },
      }}
    />
  );
};

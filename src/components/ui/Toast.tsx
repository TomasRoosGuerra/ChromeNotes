import { Toaster } from "react-hot-toast";

export const ToastContainer = () => {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--bg-color)",
          color: "var(--text-color)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
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

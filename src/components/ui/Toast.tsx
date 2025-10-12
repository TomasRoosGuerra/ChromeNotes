import toast, { Toaster } from "react-hot-toast";

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      style: {
        background: "var(--bg-color)",
        color: "var(--text-color)",
        border: "1px solid var(--border-color)",
      },
    });
  },
  error: (message: string) => {
    toast.error(message, {
      style: {
        background: "var(--bg-color)",
        color: "var(--text-color)",
        border: "1px solid var(--border-color)",
      },
    });
  },
  info: (message: string) => {
    toast(message, {
      style: {
        background: "var(--bg-color)",
        color: "var(--text-color)",
        border: "1px solid var(--border-color)",
      },
    });
  },
};

export const ToastContainer = () => {
  return <Toaster position="top-right" />;
};

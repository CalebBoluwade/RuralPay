import { useToast as useToastContext } from "../components/context/ToastProvider";

export const useToast = () => {
  const contextToast = useToastContext();

  return {
    success: (message: string, duration?: number) => {
      contextToast.showToast(message, "success", duration);
    },
    error: (message: string, duration?: number) => {
      contextToast.showToast(message, "error", duration);
    },
    warning: (message: string, duration?: number) => {
      contextToast.showToast(message, "warning", duration);
    },
    info: (message: string, duration?: number) => {
      contextToast.showToast(message, "info", duration);
    },
  };
};

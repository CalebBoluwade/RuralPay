import { ToastType } from "@/src/components/ui/Toast";

type ToastCallback = (
  message: string,
  type: ToastType,
  duration?: number,
) => void;

class ToastService {
  private toastCallback: ToastCallback | null = null;
  private isReady = false;

  setToastCallback(callback: ToastCallback) {
    this.toastCallback = callback;
    this.isReady = true;
  }

  success(message: string, duration?: number) {
    if (this.isReady) {
      this.toastCallback?.(message, "success", duration);
    }
  }

  error(message: string, duration?: number) {
    if (this.isReady) {
      this.toastCallback?.(message, "error", duration);
    }
  }

  warning(message: string, duration?: number) {
    if (this.isReady) {
      this.toastCallback?.(message, "warning", duration);
    }
  }

  info(message: string, duration?: number) {
    if (this.isReady) {
      this.toastCallback?.(message, "info", duration);
    }
  }
}

export default new ToastService();

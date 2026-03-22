import ToastService from "@/src/lib/services/ToastService";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Modal, View } from "react-native";
import { Toast, ToastType } from "../ui/Toast";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const showToast = (message: string, type: ToastType, duration?: number) => {
    const id = `${Date.now()}-${counterRef.current++}`;
    const newToast: ToastItem = { id, message, type, duration };
    setToasts((prev) => [...prev, newToast]);
  };

  useEffect(() => {
    ToastService.setToastCallback(showToast);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Modal
        visible={toasts.length > 0}
        transparent
        animationType="none"
        statusBarTranslucent
      >
        <View
          style={{ position: "absolute", top: 64, left: 0, right: 0 }}
          pointerEvents="box-none"
        >
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              duration={toast.duration}
              onDismiss={dismissToast}
            />
          ))}
        </View>
      </Modal>
    </ToastContext.Provider>
  );
};

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { CART_UPDATED_EVENT } from "../../cart/data/cartStorage";

const ToastContext = createContext(null);

function createToast(message, tone = "success") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    message,
    tone,
  };
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const toast = createToast(message, options.tone ?? "success");
    setToasts((current) => [...current.slice(-2), toast]);

    window.setTimeout(() => {
      dismissToast(toast.id);
    }, options.duration ?? 3200);

    return toast.id;
  }, [dismissToast]);

  useEffect(() => {
    function handleCartUpdate(event) {
      if (event instanceof CustomEvent && event.detail?.type === "add") {
        const itemName = event.detail.item?.name ?? "Product";
        showToast(`${itemName} added to cart.`);
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, handleCartUpdate);
    return () => window.removeEventListener(CART_UPDATED_EVENT, handleCartUpdate);
  }, [showToast]);

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }
  return context;
}

function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-slate-950 shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <p className="min-w-0 flex-1 text-sm font-medium leading-6">{toast.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

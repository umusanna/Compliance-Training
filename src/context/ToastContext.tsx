import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  severity: ToastSeverity;
  durationMs?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (message: string, severity?: ToastSeverity, durationMs?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, severity: ToastSeverity = 'success', durationMs = 4000) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastItem = { id, message, severity, durationMs };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5

      if (durationMs > 0) {
        setTimeout(() => {
          removeToast(id);
        }, durationMs);
      }
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div
        id="toast-notification-queue"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none"
      >
        {toasts.map((toast) => {
          const bgColors = {
            success: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200',
            warning: 'bg-amber-950/95 border-amber-500/40 text-amber-200',
            error: 'bg-rose-950/95 border-rose-500/40 text-rose-200',
            info: 'bg-slate-900/95 border-sky-500/40 text-sky-200',
          };

          const icons = {
            success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
            warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
            error: <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />,
            info: <Info className="w-5 h-5 text-sky-400 shrink-0" />,
          };

          return (
            <div
              key={toast.id}
              id={`toast-item-${toast.id}`}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-sm transition-all duration-200 text-sm font-medium ${bgColors[toast.severity]}`}
            >
              <div className="flex items-start gap-2.5">
                {icons[toast.severity]}
                <p className="leading-snug pt-0.5">{toast.message}</p>
              </div>
              <button
                type="button"
                id={`btn-close-toast-${toast.id}`}
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

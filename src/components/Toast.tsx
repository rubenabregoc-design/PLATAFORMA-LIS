import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X, Info, Timer } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`pointer-events-auto min-w-[320px] max-w-md bg-slate-900 border backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex items-start gap-4 ${
                t.type === 'success' ? 'border-emerald-500/50 shadow-emerald-500/10' :
                t.type === 'error' ? 'border-rose-500/50 shadow-rose-500/10' :
                t.type === 'warning' ? 'border-amber-500/50 shadow-amber-500/10' :
                'border-blue-500/50 shadow-blue-500/10'
              }`}
            >
              <div className={`mt-0.5 p-1.5 rounded-lg ${
                t.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                t.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
                t.type === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                {t.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {t.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {t.type === 'warning' && <Timer className="w-5 h-5" />}
                {t.type === 'info' && <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-white leading-relaxed">{t.message}</p>
                <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: (t.duration || 4000) / 1000, ease: 'linear' }}
                    className={`h-full ${
                      t.type === 'success' ? 'bg-emerald-500' :
                      t.type === 'error' ? 'bg-rose-500' :
                      t.type === 'warning' ? 'bg-amber-500' :
                      'bg-blue-500'
                    }`}
                   />
                </div>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

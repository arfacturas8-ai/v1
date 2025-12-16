/**
 * Undo Toast System
 * Shows "Action completed [Undo]" toasts for destructive actions
 */

import React, { useState, useEffect } from 'react';
import { X, RotateCcw, CheckCircle, AlertCircle, Info } from 'lucide-react';

const UndoToast = ({ message, onUndo, duration = 5000, type = 'success', onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - (100 / (duration / 100));
        if (newProgress <= 0) {
          setIsVisible(false);
          onDismiss?.();
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration, onDismiss]);

  const handleUndo = () => {
    onUndo();
    setIsVisible(false);
    onDismiss?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info
  };

  const Icon = icons[type] || CheckCircle;

  const colorClasses = {
    success: 'from-green-600 to-green-700',
    error: 'from-red-600 to-red-700',
    info: 'from-blue-600 to-purple-600'
  };

  const colorClass = colorClasses[type] || colorClasses.success;

  if (!isVisible) return null;

  return (
    <div className="relative bg-white  rounded-xl shadow-2xl overflow-hidden min-w-[320px] sm:min-w-[400px]" style={{ border: '1px solid var(--border-subtle)' }}>
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--bg-secondary)' }}>
        <div
          className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-100`}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 pt-5 flex items-center gap-3">
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
          <Icon size={24} style={{color: "var(--text-primary)"}} className="" />
        </div>

        <p className="flex-1 text-sm sm:text-base font-medium" style={{ color: 'var(--text-primary)' }}>{message}</p>

        {onUndo && (
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[36px] hover:bg-[#F8F9FA]"
            style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          >
            <RotateCcw size={24} />
            Undo
          </button>
        )}

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1.5 rounded-lg transition-colors min-h-[36px] min-w-[36px] hover:bg-[#F8F9FA]"
          style={{ color: 'var(--text-secondary)' }}
        >
          <X size={24} />
        </button>
      </div>
    </div>
  );
};

/**
 * Toast Container - manages multiple toasts
 */
export const UndoToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto animate-in slide-in-from-bottom-2">
          <UndoToast
            {...toast}
            onDismiss={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default UndoToast;

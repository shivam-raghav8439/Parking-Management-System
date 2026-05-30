import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  type = 'warning'
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 overflow-x-hidden overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      ></div>

      {/* Modal Box */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-md bg-white dark:bg-slate-900 rounded-none sm:rounded-2xl shadow-2xl border-0 sm:border border-slate-200 dark:border-slate-800 animate-slide-up flex flex-col overflow-y-auto z-10">
        <div className="absolute top-4 right-4">
          <button 
            type="button" 
            onClick={onCancel} 
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${
              type === 'danger' 
                ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400' 
                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-6">{title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 ${
                type === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
                  : 'bg-primary-600 hover:bg-primary-700 active:bg-primary-800'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

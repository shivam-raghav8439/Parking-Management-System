import React from 'react';

export function CardSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse rounded-xl bg-white dark:bg-slate-900">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-4"></div>
      <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded w-2/3 mb-2"></div>
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="w-full animate-pulse space-y-4">
      <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-full"></div>
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex space-x-4 w-full">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-8 bg-slate-200 dark:bg-slate-800 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function SlotGridSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-4 animate-pulse">
      {[...Array(15)].map((_, i) => (
        <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      ))}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

export default Spinner;

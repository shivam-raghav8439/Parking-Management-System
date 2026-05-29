import React from 'react';

export default function Badge({ type, children }) {
  const getColors = () => {
    switch (type?.toLowerCase()) {
      // Slot/Record Statuses
      case 'available':
      case 'free':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50';
      case 'occupied':
      case 'parked':
      case 'active':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50';
      case 'reserved':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50';
      case 'exited':
      case 'closed':
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800/40 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50';

      // Vehicle Types
      case 'car':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50';
      case 'bike':
        return 'bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-400 border border-violet-200 dark:border-violet-900/50';
      case 'bicycle':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-400 border border-teal-200 dark:border-teal-900/50';
      case 'bus':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50';

      // Owner Types
      case 'student':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/50';
      case 'faculty':
        return 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-400 border border-fuchsia-200 dark:border-fuchsia-900/50';
      case 'staff':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50';
      case 'visitor':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-400 border border-pink-200 dark:border-pink-900/50';

      // Info
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide inline-flex items-center justify-center ${getColors()}`}>
      {children || type}
    </span>
  );
}

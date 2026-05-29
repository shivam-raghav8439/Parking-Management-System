import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendType = 'up', 
  description,
  color = 'blue'
}) {
  const getColorClasses = () => {
    switch (color) {
      case 'emerald':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20',
          border: 'border-emerald-100 dark:border-emerald-900/30',
          text: 'text-emerald-600 dark:text-emerald-400',
          accent: 'from-emerald-500/20 to-transparent'
        };
      case 'rose':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/20',
          border: 'border-rose-100 dark:border-rose-900/30',
          text: 'text-rose-600 dark:text-rose-400',
          accent: 'from-rose-500/20 to-transparent'
        };
      case 'amber':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          border: 'border-amber-100 dark:border-amber-900/30',
          text: 'text-amber-600 dark:text-amber-400',
          accent: 'from-amber-500/20 to-transparent'
        };
      case 'indigo':
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/20',
          border: 'border-indigo-100 dark:border-indigo-900/30',
          text: 'text-indigo-600 dark:text-indigo-400',
          accent: 'from-indigo-500/20 to-transparent'
        };
      default: // blue
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          border: 'border-blue-100 dark:border-blue-900/30',
          text: 'text-primary-600 dark:text-primary-400',
          accent: 'from-primary-500/20 to-transparent'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`glass-card relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-slate-900 border ${colors.border}`}>
      {/* Decorative gradient corner */}
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl ${colors.accent} rounded-bl-full pointer-events-none opacity-50`}></div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${colors.bg} ${colors.text}`}>
            <Icon className="w-5.5 h-5.5" />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans">{value}</span>
        {trend && (
          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
            trendType === 'up' 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
          }`}>
            {trendType === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
            {trend}
          </span>
        )}
      </div>
      
      {description && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-normal">
          {description}
        </p>
      )}
    </div>
  );
}

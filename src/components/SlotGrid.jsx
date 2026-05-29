import React from 'react';
import Badge from './Badge';

export default function SlotGrid({ slots = [], onSlotClick }) {
  
  const getSlotStatusStyles = (status) => {
    switch (status) {
      case 'occupied':
        return 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 hover:shadow-rose-100 dark:hover:shadow-none hover:border-rose-450 text-rose-900 dark:text-rose-100 cursor-pointer';
      case 'reserved':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:shadow-amber-100 dark:hover:shadow-none hover:border-amber-450 text-amber-900 dark:text-amber-100 cursor-pointer';
      default: // available
        return 'bg-emerald-50 dark:bg-emerald-950/10 border-emerald-250 dark:border-emerald-900/20 hover:shadow-emerald-100 dark:hover:shadow-none hover:border-emerald-450 text-emerald-900 dark:text-emerald-300';
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {slots.map((slot) => {
        const isOccupied = slot.status === 'occupied';
        const styles = getSlotStatusStyles(slot.status);

        return (
          <div
            key={slot.slotNumber}
            onClick={() => onSlotClick && onSlotClick(slot)}
            className={`border rounded-2xl p-4 flex flex-col justify-between h-28 shadow-sm transition-all duration-200 hover:-translate-y-0.5 select-none ${styles}`}
          >
            {/* Slot Header */}
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold tracking-wider font-mono">
                {slot.slotNumber}
              </span>
              <span className="w-2.5 h-2.5 rounded-full" style={{
                backgroundColor: slot.status === 'occupied' 
                  ? '#f43f5e' // Rose-500
                  : slot.status === 'reserved' 
                    ? '#f59e0b' // Amber-500
                    : '#10b981' // Emerald-500
              }}></span>
            </div>

            {/* Slot Body */}
            <div className="mt-3 flex-1 flex flex-col justify-end">
              {isOccupied ? (
                <div className="space-y-1">
                  <div className="license-plate-small block w-fit text-[10px] font-mono leading-none">
                    {slot.plate}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-5 h-5 rounded-full bg-rose-200/50 dark:bg-rose-900/40 text-[9px] font-bold flex items-center justify-center border border-rose-300/30">
                      {slot.ownerInitials}
                    </div>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[70px]">
                      Occupied
                    </span>
                  </div>
                </div>
              ) : slot.status === 'reserved' ? (
                <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Reserved
                </div>
              ) : (
                <div className="text-[10px] font-semibold text-emerald-650 dark:text-emerald-450 uppercase tracking-wider">
                  Available
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

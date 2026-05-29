import { differenceInMilliseconds } from 'date-fns';

/**
 * Calculates parking fee based on entry and exit time.
 * @param {string|Date} entryTime 
 * @param {string|Date} exitTime 
 * @param {number} hourlyRate 
 * @returns {object} { fee: number, durationHours: number, durationMinutes: number }
 */
export function calculateFee(entryTime, exitTime, hourlyRate) {
  const start = new Date(entryTime);
  const end = exitTime ? new Date(exitTime) : new Date();
  
  const diffMs = differenceInMilliseconds(end, start);
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  
  const hours = diffMinutes / 60;
  // Charge for at least 1 hour, and round up to next hour for any fractional hour
  const billableHours = Math.max(1, Math.ceil(hours));
  const fee = billableHours * (hourlyRate || 0);
  
  return {
    fee,
    durationHours: Math.floor(diffMinutes / 60),
    durationMinutes: diffMinutes % 60,
    totalMinutes: diffMinutes
  };
}

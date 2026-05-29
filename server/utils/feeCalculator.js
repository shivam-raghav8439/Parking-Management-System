import { differenceInMilliseconds } from 'date-fns';

/**
 * Calculates parking fee based on vehicle type and duration.
 * @param {string} vehicleType 
 * @param {string|Date} entryTime 
 * @param {string|Date} exitTime 
 * @param {object} rates 
 * @returns {object} { fee: number, durationMinutes: number }
 */
export function calcFee(vehicleType, entryTime, exitTime, rates) {
  const start = new Date(entryTime);
  const end = exitTime ? new Date(exitTime) : new Date();
  
  const diffMs = differenceInMilliseconds(end, start);
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
  
  const hours = diffMinutes / 60;
  // Charge minimum 1 hour, and round up to next hour for fractional parts
  const billableHours = Math.max(1, Math.ceil(hours));
  
  const hourlyRate = rates[vehicleType] || 10;
  const fee = billableHours * hourlyRate;
  
  return {
    fee,
    durationMinutes: diffMinutes
  };
}

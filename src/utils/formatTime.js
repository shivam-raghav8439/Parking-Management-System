import { format, formatDistanceToNow } from 'date-fns';

/**
 * Formats a date string into readable text.
 * e.g., 29 May 2026 11:59 PM
 */
export function formatDateTime(date) {
  if (!date) return '-';
  try {
    return format(new Date(date), 'dd MMM yyyy, hh:mm a');
  } catch (e) {
    return '-';
  }
}

/**
 * Formats duration from hours and minutes into "Xh Ym" format.
 */
export function formatDuration(hours, minutes) {
  if (hours === 0 && minutes === 0) return '0m';
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

/**
 * Returns humanized relative time (e.g., "5 mins ago").
 */
export function formatRelativeTime(date) {
  if (!date) return '';
  try {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  } catch (e) {
    return '';
  }
}

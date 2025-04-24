
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isBefore } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function convertTimeInHoursMinSec(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h${minutes}m`;
}

export function getNumber(str) {
  return str.replace(/\D/g, '');
}

export function isDateBetween(date, start, end) {
  return !isBefore(date, start) && !isBefore(end, date);
}

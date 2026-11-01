import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format as dateFnsFormat } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeDate(val: any): Date | null {
  if (!val) return null;
  
  // Handle Firestore Timestamp
  if (typeof val.toDate === 'function') {
    try {
      const d = val.toDate();
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  }
  
  // Handle if it's already a date object
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val;
  }
  
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date;
}

export function formatDate(date: any, formatStr: string = 'MMM d, yyyy'): string {
  const d = safeDate(date);
  if (!d) return 'N/A';
  
  try {
    return dateFnsFormat(d, formatStr);
  } catch (e) {
    return 'Invalid Date';
  }
}

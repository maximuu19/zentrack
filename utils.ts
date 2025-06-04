
import { Task } from './types';

/**
 * Sorts tasks chronologically by their startDate.
 * Tasks without a startDate are placed at the end.
 */
export const sortTasksChronologically = (tasks: Task[]): Task[] => {
  if (!tasks) return [];
  return [...tasks].sort((a, b) => {
    const aHasDate = !!a.startDate;
    const bHasDate = !!b.startDate;

    if (aHasDate && !bHasDate) return -1; // a (with date) comes before b (without date)
    if (!aHasDate && bHasDate) return 1;  // b (with date) comes before a (without date)
    if (!aHasDate && !bHasDate) {
        // Optional: sort by name or other criteria if no dates
        return a.name.localeCompare(b.name);
    }

    // If both have dates, compare them
    const dateA = new Date(a.startDate!).getTime();
    const dateB = new Date(b.startDate!).getTime();

    return dateA - dateB;
  });
};

/**
 * Formats a date string (YYYY-MM-DD) into a more readable format.
 */
export const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    // Ensure correct parsing for YYYY-MM-DD by specifying UTC to avoid timezone issues.
    // Adding 'T00:00:00Z' makes it explicit UTC.
    const dateParts = dateString.split('-');
    if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) -1; // Month is 0-indexed
        const day = parseInt(dateParts[2], 10);
        const date = new Date(Date.UTC(year, month, day));
        
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            timeZone: 'UTC' // Specify timezone for consistency
        });
    }
    // Fallback for potentially already formatted or different date strings
    return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', month: 'short', day: 'numeric' 
    });
};

/**
 * Formats file size into a human-readable string.
 */
export const formatFileSize = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
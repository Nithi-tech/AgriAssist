// /src/lib/date.ts

/**
 * Convert ISO date (YYYY-MM-DD) to DD-MM-YYYY format for OGD API
 */
export function toOgdDateFormat(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

/**
 * Convert DD-MM-YYYY format from OGD API to ISO date (YYYY-MM-DD)
 */
export function fromOgdDateFormat(ogdDate: string): string {
  const [day, month, year] = ogdDate.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get yesterday's date in ISO format (YYYY-MM-DD)
 */
export function getYesterdayISO(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Get date N days ago in ISO format
 */
export function getDaysAgoISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

/**
 * Get array of last N days in ISO format
 */
export function getLastNDaysISO(days: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < days; i++) {
    dates.push(getDaysAgoISO(i));
  }
  return dates;
}

/**
 * Validate ISO date format (YYYY-MM-DD)
 */
export function isValidISODate(dateStr: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateStr)) return false;
  
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0] === dateStr;
}

/**
 * Format date for display (e.g., "Aug 19, 2025")
 */
export function formatDateForDisplay(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format timestamp for display (e.g., "Aug 19, 2025 at 2:30 PM")
 */
export function formatTimestampForDisplay(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Get relative time string (e.g., "2 hours ago", "yesterday")
 */
export function getRelativeTimeString(isoTimestamp: string): string {
  const now = new Date();
  const date = new Date(isoTimestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
  
  return formatDateForDisplay(isoTimestamp);
}

/**
 * Check if two ISO dates are the same
 */
export function isSameDate(date1: string, date2: string): boolean {
  return date1 === date2;
}

/**
 * Check if date is within last N days
 */
export function isWithinLastNDays(isoDate: string, days: number): boolean {
  const date = new Date(isoDate);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  return date >= cutoff;
}

/**
 * Get business days (excluding weekends) for market data
 */
export function getBusinessDaysISO(days: number): string[] {
  const businessDays: string[] = [];
  let currentDate = new Date();
  let count = 0;
  
  while (businessDays.length < days && count < days * 2) { // safety limit
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays.push(currentDate.toISOString().split('T')[0]);
    }
    
    currentDate.setDate(currentDate.getDate() - 1);
    count++;
  }
  
  return businessDays;
}

/**
 * Check if date is a weekend
 */
export function isWeekend(isoDate: string): boolean {
  const date = new Date(isoDate);
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

/**
 * Get the most recent business day (excluding weekends)
 */
export function getMostRecentBusinessDayISO(): string {
  let date = new Date();
  
  while (isWeekend(date.toISOString().split('T')[0])) {
    date.setDate(date.getDate() - 1);
  }
  
  return date.toISOString().split('T')[0];
}

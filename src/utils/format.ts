/**
 * Format a number as Indonesian Rupiah currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format date to local string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength = 100): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Format date consistently for API in YYYY-MM-DD format
 */
export const formatDateForAPI = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Create a date set to start of day (00:00:00)
 */
export const createStartOfDay = (dateStr: string): Date => {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Create a date set to end of day (23:59:59.999)
 */
export const createEndOfDay = (dateStr: string): Date => {
  const date = new Date(dateStr);
  date.setHours(23, 59, 59, 999);
  return date;
};

/**
 * Check if a date falls within a specified range
 */
export const isDateInRange = (
  dateToCheck: string | Date, 
  startDateStr: string, 
  endDateStr: string
): boolean => {
  try {
    // Convert to Date objects
    const date = dateToCheck instanceof Date ? dateToCheck : new Date(dateToCheck);
    
    // Create boundaries
    const startDate = createStartOfDay(startDateStr);
    const endDate = createEndOfDay(endDateStr);
    
    // Check for valid dates
    if (isNaN(date.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.warn('Invalid date in isDateInRange:', { dateToCheck, startDateStr, endDateStr });
      return false;
    }
    
    // Check if date is within range (inclusive)
    return date >= startDate && date <= endDate;
  } catch (e) {
    console.error('Error in isDateInRange:', e);
    return false;
  }
};

/**
 * Calculate a date range for the last X days
 */
export const calculateDateRange = (days: number): { start: string, end: string } => {
  const endDate = new Date();
  const startDate = new Date();
  
  // Subtract days from start date
  startDate.setDate(startDate.getDate() - (days - 1)); // -1 to include today
  
  return {
    start: formatDateForAPI(startDate),
    end: formatDateForAPI(endDate)
  };
};

/**
 * Parse an API date string safely
 */
export const parseAPIDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (e) {
    console.error('Error parsing date:', dateStr, e);
    return null;
  }
}; 
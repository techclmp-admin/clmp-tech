/**
 * Canadian Standards Utilities
 * Centralized formatting for currency, dates, and measurements according to Canadian standards
 */

// Canadian Timezones
export const CANADIAN_TIMEZONES = {
  EASTERN: 'America/Toronto',
  CENTRAL: 'America/Winnipeg',
  MOUNTAIN: 'America/Edmonton',
  PACIFIC: 'America/Vancouver',
  ATLANTIC: 'America/Halifax',
  NEWFOUNDLAND: 'America/St_Johns',
} as const;

// Default to Eastern Time (most populous region)
export const DEFAULT_TIMEZONE = CANADIAN_TIMEZONES.EASTERN;

/**
 * Format currency in Canadian dollars
 * @param amount - The amount to format
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, language: 'en' | 'fr' = 'en'): string => {
  const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format currency in Canadian dollars (compact, no decimals)
 * @param amount - The amount to format
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted currency string without decimals
 */
export const formatCurrencyCompact = (amount: number, language: 'en' | 'fr' = 'en'): string => {
  const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date according to Canadian standards
 * @param date - Date to format
 * @param language - Language code ('en' or 'fr')
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  language: 'en' | 'fr' = 'en',
  options?: Intl.DateTimeFormatOptions
): string => {
  const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  };
  
  return dateObj.toLocaleDateString(locale, defaultOptions);
};

/**
 * Format date with full details (weekday, month, day, year)
 * @param date - Date to format
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted date string
 */
export const formatDateLong = (date: Date | string, language: 'en' | 'fr' = 'en'): string => {
  return formatDate(date, language, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Format time according to Canadian standards (24-hour format)
 * @param date - Date/time to format
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted time string
 */
export const formatTime = (
  date: Date | string,
  language: 'en' | 'fr' = 'en'
): string => {
  const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Canada commonly uses 24-hour format
  });
};

/**
 * Format time with 12-hour format (for preference)
 * @param date - Date/time to format
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted time string in 12-hour format
 */
export const formatTime12Hour = (
  date: Date | string,
  language: 'en' | 'fr' = 'en'
): string => {
  const locale = language === 'fr' ? 'fr-CA' : 'en-CA';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString(locale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format temperature in Celsius (Canadian standard)
 * @param celsius - Temperature in Celsius
 * @returns Formatted temperature string
 */
export const formatTemperature = (celsius: number): string => {
  return `${Math.round(celsius)}°C`;
};

/**
 * Format distance in kilometers (Canadian standard - metric)
 * @param km - Distance in kilometers
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted distance string
 */
export const formatDistance = (km: number, language: 'en' | 'fr' = 'en'): string => {
  if (km < 1) {
    return `${Math.round(km * 1000)} ${language === 'fr' ? 'm' : 'm'}`;
  }
  return `${km.toFixed(1)} ${language === 'fr' ? 'km' : 'km'}`;
};

/**
 * Format weight in kilograms (Canadian standard - metric)
 * @param kg - Weight in kilograms
 * @param language - Language code ('en' or 'fr')
 * @returns Formatted weight string
 */
export const formatWeight = (kg: number, language: 'en' | 'fr' = 'en'): string => {
  if (kg < 1) {
    return `${Math.round(kg * 1000)} ${language === 'fr' ? 'g' : 'g'}`;
  }
  return `${kg.toFixed(1)} ${language === 'fr' ? 'kg' : 'kg'}`;
};

/**
 * Get Canadian locale string based on language
 * @param language - Language code ('en' or 'fr')
 * @returns Locale string
 */
export const getCanadianLocale = (language: 'en' | 'fr' = 'en'): string => {
  return language === 'fr' ? 'fr-CA' : 'en-CA';
};

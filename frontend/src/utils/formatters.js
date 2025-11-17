// ==================== NUMBER FORMATTING UTILITIES ====================

/**
 * Format a number with commas for thousands separators
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number with commas
 * 
 * Examples:
 * formatNumber(12000) → "12,000.00"
 * formatNumber(1234567.89) → "1,234,567.89"
 * formatNumber(500, 0) → "500"
 */
export const formatNumber = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0' + (decimals > 0 ? '.' + '0'.repeat(decimals) : '')
  }
  
  const num = parseFloat(value)
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

/**
 * Format a number as currency with cedis symbol
 * @param {number} value - The amount to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted currency with ₵ symbol
 * 
 * Examples:
 * formatCurrency(12000) → "₵12,000.00"
 * formatCurrency(1234567.89) → "₵1,234,567.89"
 */
export const formatCurrency = (value, decimals = 2) => {
  return '₵' + formatNumber(value, decimals)
}

/**
 * Format large numbers with K, M, B suffixes
 * @param {number} value - The number to format
 * @returns {string} Formatted number with suffix
 * 
 * Examples:
 * formatCompactNumber(1500) → "1.5K"
 * formatCompactNumber(1500000) → "1.5M"
 * formatCompactNumber(1500000000) → "1.5B"
 */
export const formatCompactNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'
  }
  
  const num = parseFloat(value)
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  
  return num.toFixed(0)
}

/**
 * Parse a formatted number string back to a number
 * @param {string} formattedValue - The formatted string to parse
 * @returns {number} The parsed number
 * 
 * Examples:
 * parseFormattedNumber("12,000.00") → 12000
 * parseFormattedNumber("₵1,234,567.89") → 1234567.89
 */
export const parseFormattedNumber = (formattedValue) => {
  if (typeof formattedValue !== 'string') {
    return parseFloat(formattedValue) || 0
  }
  
  // Remove currency symbol, commas, and spaces
  const cleaned = formattedValue.replace(/[₵$,\s]/g, '')
  return parseFloat(cleaned) || 0
}
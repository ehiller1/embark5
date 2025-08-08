/**
 * Utility functions for processing financial text data
 * Handles common formatting issues in AI-generated financial content
 */

/**
 * Clean financial text by removing underscores, fixing spacing, and improving readability
 */
export const cleanFinancialText = (text: string): string => {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Fix common financial abbreviations
    .replace(/\bROI\b/gi, 'ROI')
    .replace(/\bKPI\b/gi, 'KPI')
    .replace(/\bNPV\b/gi, 'NPV')
    .replace(/\bIRR\b/gi, 'IRR')
    // Capitalize first letter of sentences
    .replace(/([.!?]\s*)([a-z])/g, (match, punctuation, letter) => 
      punctuation + letter.toUpperCase()
    )
    // Ensure first character is capitalized
    .replace(/^[a-z]/, (match) => match.toUpperCase())
    // Remove leading/trailing whitespace
    .trim();
};

/**
 * Clean financial data object recursively
 */
export const cleanFinancialData = (obj: any): any => {
  if (typeof obj === 'string') {
    return cleanFinancialText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(cleanFinancialData);
  }
  
  if (obj && typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Clean the key name as well
      const cleanKey = key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      cleaned[key] = cleanFinancialData(value); // Keep original key for compatibility
    }
    return cleaned;
  }
  
  return obj;
};

/**
 * Format currency values consistently
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage values consistently
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
};

/**
 * Clean and format financial narrative text
 */
export const formatFinancialNarrative = (text: string): string => {
  if (!text) return text;
  
  return cleanFinancialText(text)
    // Add proper spacing after periods
    .replace(/\.([A-Z])/g, '. $1')
    // Ensure proper capitalization after colons
    .replace(/:(\s*)([a-z])/g, (match, space, letter) => 
      ':' + space + letter.toUpperCase()
    );
};

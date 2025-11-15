/**
 * Normalize Arabic text for search
 * Removes diacritics and converts to lowercase for better search matching
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics
    .replace(/[إأآا]/g, 'ا') // Normalize Alef variations
    .replace(/ى/g, 'ي') // Normalize Yeh variations
    .replace(/ة/g, 'ه') // Normalize Teh Marbuta
    .trim();
}

/**
 * Generate search tokens from Arabic text for array-based search
 * Splits text into words and creates tokens for fast Firestore queries
 */
export function generateSearchTokens(text: string): string[] {
  if (!text) return [];
  
  const normalized = normalizeArabic(text);
  // Split by spaces and filter empty strings
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  
  // Create tokens: full text + individual words + prefixes (first 3+ chars of each word)
  const tokens = new Set<string>();
  
  // Add full normalized text
  if (normalized.length > 0) {
    tokens.add(normalized);
  }
  
  // Add each word
  words.forEach(word => {
    if (word.length > 0) {
      tokens.add(word);
      // Add prefixes for partial matching (3+ characters)
      for (let i = 3; i <= word.length; i++) {
        tokens.add(word.substring(0, i));
      }
    }
  });
  
  return Array.from(tokens);
}

/**
 * Search function for Arabic text (client-side filtering)
 */
export function searchArabic(text: string, query: string): boolean {
  const normalizedText = normalizeArabic(text);
  const normalizedQuery = normalizeArabic(query);
  return normalizedText.includes(normalizedQuery);
}


/**
 * Converts Arabic-Indic numbers (٠-٩) to standard English/Latin numbers (0-9).
 * Leaves all other characters unchanged.
 */
export function toEnglishDigits(str: string): string {
  if (!str) return str;
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => arabicNumbers.indexOf(w).toString());
}

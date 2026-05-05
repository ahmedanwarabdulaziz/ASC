/**
 * App-level configuration
 * Static values that describe application behavior
 */

export const APP_CONFIG = {
  /** Club name in Arabic (primary) */
  clubNameAr: 'نادي أسيوط الرياضي',
  /** Club name in English (helper) */
  clubNameEn: 'Assiut Sporting Club',
  /** Default locale */
  locale: 'ar',
  /** Text direction */
  dir: 'rtl' as const,
  /** App description for metadata */
  descriptionAr: 'المنصة الرسمية لنادي أسيوط الرياضي',
  descriptionEn: 'Official platform for Assiut Sporting Club',
} as const;

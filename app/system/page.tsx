import styles from './page.module.css';

export const dynamic = 'force-dynamic';

export default function SystemPage() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Status Badge */}
        <div className={styles.statusBadge}>
          <span className={styles.statusDot} />
          قيد التطوير
        </div>

        {/* Icon */}
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <rect x="6" y="10" width="36" height="28" rx="4" stroke="currentColor" strokeWidth="2" />
            <path d="M6 18H42" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
            <circle cx="17" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
            <circle cx="22" cy="14" r="1.5" fill="currentColor" opacity="0.5" />
            <path d="M18 28L22 24L26 28L30 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          </svg>
        </div>

        {/* Title */}
        <h1 className={styles.title}>النظام قيد التطوير</h1>

        {/* Description */}
        <p className={styles.description}>
          نعمل حالياً على بناء النظام التشغيلي لنادي أسيوط الرياضي.
          <br />
          سيتم إضافة الوحدات والشاشات تباعاً في المراحل القادمة.
        </p>

        {/* Progress items */}
        <div className={styles.progressList}>
          <div className={styles.progressItem}>
            <span className={styles.checkIcon}>✓</span>
            <span>تأسيس المشروع والبنية الأساسية</span>
          </div>
          <div className={styles.progressItem}>
            <span className={styles.checkIcon}>✓</span>
            <span>ربط قاعدة البيانات</span>
          </div>
          <div className={styles.progressItem}>
            <span className={styles.checkIcon}>✓</span>
            <span>صفحة الدخول وتسجيل الدخول</span>
          </div>
          <div className={styles.progressItem}>
            <span className={styles.checkIcon}>✓</span>
            <span>نظام الصلاحيات والأمان (المرحلة ١)</span>
          </div>
          <div className={styles.progressItem}>
            <span className={styles.checkIcon}>✓</span>
            <span>سجل الأشخاص (المرحلة ٢أ)</span>
          </div>
          <div className={`${styles.progressItem} ${styles.progressPending}`}>
            <span className={styles.pendingIcon}>○</span>
            <span>سجل العضويات (المرحلة ٢ب)</span>
          </div>
          <div className={`${styles.progressItem} ${styles.progressPending}`}>
            <span className={styles.pendingIcon}>○</span>
            <span>الموظفين والأدوار</span>
          </div>
        </div>
      </div>
    </div>
  );
}

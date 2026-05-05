import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import styles from './sports.module.css';

export const metadata = {
  title: 'الرياضات المتاحة',
};

export const revalidate = 60;

export default async function SportsPage() {
  const supabase = await createClient();

  const { data: sports } = await supabase
    .from('sports')
    .select(`
      *,
      sectors:sport_sectors (
        id, name,
        groups:training_groups(count)
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true });

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>الأنشطة الرياضية</h1>
          <p className={styles.heroSubtitle}>
            استكشف مجموعة واسعة من الرياضات التي يقدمها النادي لمختلف الأعمار والمستويات، 
            تحت إشراف نخبة من أفضل المدربين.
          </p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sportsGrid}>
          {sports && sports.length > 0 ? (
            sports.map((sport) => {
              // Calculate total active groups across all sectors for this sport
              const totalGroups = sport.sectors?.reduce((acc: number, curr: any) => acc + (curr.groups?.[0]?.count || 0), 0) || 0;
              
              return (
                <div key={sport.id} className={styles.sportCard}>
                  <div className={styles.sportHeader}>
                    <div className={styles.sportIcon}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                        <path d="M2 12h20" />
                      </svg>
                    </div>
                    <h2 className={styles.sportTitle}>{sport.name}</h2>
                  </div>
                  
                  <div className={styles.sportStats}>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{sport.sectors?.length || 0}</span>
                      <span className={styles.statLabel}>قطاعات</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.statValue}>{totalGroups}</span>
                      <span className={styles.statLabel}>مجموعات نشطة</span>
                    </div>
                  </div>

                  <div className={styles.sectorsList}>
                    <h3 className={styles.sectorsTitle}>القطاعات المتاحة:</h3>
                    <ul>
                      {sport.sectors?.map((sector: any) => (
                        <li key={sector.id}>{sector.name}</li>
                      ))}
                    </ul>
                  </div>

                  <div className={styles.sportFooter}>
                    <Link href="/auth/login" className={styles.registerBtn}>التسجيل والاستعلام</Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.emptyState}>لا توجد رياضات متاحة حالياً</div>
          )}
        </div>
      </section>
    </div>
  );
}

import { getMedicalApprovalsDashboard } from '@/server/actions/sports/medical-approvals';
import { MedicalApprovalsClient } from '@/features/sports/components/medical-approvals-client';
import workspace from '@/features/system/components/workspace.module.css';

export const metadata = {
  title: 'إدارة الموافقات الطبية',
};

export const dynamic = 'force-dynamic';

export default async function MedicalApprovalsPage() {
  const result = await getMedicalApprovalsDashboard();

  if (!result.success || !result.data) {
    return (
      <div className={workspace.page} dir="rtl">
        <section className={workspace.surface}>
          <div className={workspace.contentBlock}>
            <h1 className={workspace.detailTitle}>تعذر تحميل صفحة الموافقات الطبية</h1>
            <p className={workspace.detailSubtitle}>
              {result.error || 'حدث خطأ أثناء جلب بيانات الموافقات الطبية.'}
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>Medical & Eligibility</span>
            <h1 className={workspace.title}>إدارة الموافقات الطبية</h1>
            <p className={workspace.description}>
              شاشة مستقلة لمتابعة اللاعبين المسجلين، ومعرفة من يملك موافقة طبية، ومن ما زال
              بدون موافقة، ومن ستنتهي موافقته خلال أقل من شهرين.
            </p>
          </div>
          <div className={workspace.heroAside}>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{result.data.summary.total_players}</span>
              <span className={workspace.heroStatLabel}>لاعب مسجل</span>
            </div>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{result.data.summary.expiring_soon}</span>
              <span className={workspace.heroStatLabel}>تنتهي قريبًا</span>
            </div>
          </div>
        </div>
      </section>

      <section className={workspace.surface}>
        <MedicalApprovalsClient rows={result.data.rows} summary={result.data.summary} />
      </section>
    </div>
  );
}

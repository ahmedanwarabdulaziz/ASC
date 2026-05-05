import Link from 'next/link';
import { StaffSettingsClient } from '@/features/staff/components/staff-settings-client';
import { getAssignableRoles, getStaffCategories, getStaffSubcategories, getStaffGroups, getStaffJobs } from '@/server/actions/staff/settings';
import workspace from '@/features/system/components/workspace.module.css';

export const dynamic = 'force-dynamic';

export default async function StaffSettingsPage() {
  const [categoriesRes, subcategoriesRes, groupsRes, jobsRes, rolesRes] = await Promise.all([
    getStaffCategories(),
    getStaffSubcategories(),
    getStaffGroups(),
    getStaffJobs(),
    getAssignableRoles(),
  ]);

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>Settings & Configuration</span>
            <h1 className={workspace.title}>إعدادات الموظفين والوظائف</h1>
            <p className={workspace.description}>
              إدارة الهيكل التنظيمي للموظفين، الأقسام، مجموعات الصلاحيات والوظائف المتاحة للنظام.
            </p>
          </div>
        </div>
      </section>

      <section className={workspace.toolbar}>
        <div className={workspace.searchSlot}>
        </div>
        <div className={workspace.toolbarActions}>
          <Link href="/system/roles" className={workspace.secondaryAction} style={{ padding: '0.75rem 1.5rem', background: '#fff8eb', color: '#6b4f11', border: '1px solid #f0d99a', borderRadius: '8px', fontWeight: 600, textDecoration: 'none' }}>
            إدارة الأدوار والصلاحيات
          </Link>
          <Link href="/system/staff" className={workspace.secondaryAction} style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', color: '#1e452b', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 500, textDecoration: 'none' }}>
            العودة لقائمة الموظفين
          </Link>
        </div>
      </section>

      <section className={workspace.surface}>
        <StaffSettingsClient 
          categories={categoriesRes.data || []}
          subcategories={subcategoriesRes.data || []}
          groups={groupsRes.data || []}
          jobs={jobsRes.data || []}
          roleOptions={rolesRes.data || []}
        />
      </section>
    </div>
  );
}

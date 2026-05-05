import Link from 'next/link';
import { RolesPermissionsClient } from '@/features/roles/components/roles-permissions-client';
import workspace from '@/features/system/components/workspace.module.css';
import { requirePermission } from '@/server/permissions/require-permission';
import { getRolesWorkspace } from '@/server/actions/roles';
import { PERMISSIONS } from '@/types/permissions';

export const dynamic = 'force-dynamic';

export default async function RolesPage() {
  await requirePermission(PERMISSIONS.ROLES_READ);
  const result = await getRolesWorkspace();

  if (!result.success || !result.data) {
    return (
      <div className={workspace.page} dir="rtl">
        <section className={workspace.surface}>
          <div className={workspace.contentBlock}>
            <h1 className={workspace.detailTitle}>تعذر تحميل الأدوار والصلاحيات</h1>
            <p className={workspace.detailSubtitle}>
              {result.error || 'حدث خطأ غير متوقع أثناء قراءة تعريفات الأدوار.'}
            </p>
          </div>
        </section>
      </div>
    );
  }

  const { roles, permissions, links } = result.data;

  return (
    <div className={workspace.page} dir="rtl">
      <section className={workspace.hero}>
        <div className={workspace.heroRow}>
          <div>
            <span className={workspace.eyebrow}>Security & Access</span>
            <h1 className={workspace.title}>إدارة الأدوار والصلاحيات</h1>
            <p className={workspace.description}>
              أنشئ الأدوار التشغيلية مثل مدير العضويات أو مشرف حمام السباحة، ثم اختر أكواد الصلاحيات
              التي يجب أن يحملها كل دور داخل النظام.
            </p>
          </div>
          <div className={workspace.heroAside}>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{roles.length}</span>
              <span className={workspace.heroStatLabel}>عدد الأدوار</span>
            </div>
            <div className={workspace.heroStat}>
              <span className={workspace.heroStatValue}>{permissions.length}</span>
              <span className={workspace.heroStatLabel}>أكواد الصلاحيات</span>
            </div>
          </div>
        </div>
      </section>

      <section className={workspace.toolbar}>
        <div className={workspace.searchSlot} />
        <div className={workspace.toolbarActions}>
          <Link href="/system/staff/settings" className={workspace.secondaryAction}>
            العودة إلى إعدادات الموظفين
          </Link>
        </div>
      </section>

      <section className={workspace.surface}>
        <RolesPermissionsClient roles={roles} permissions={permissions} links={links} />
      </section>
    </div>
  );
}

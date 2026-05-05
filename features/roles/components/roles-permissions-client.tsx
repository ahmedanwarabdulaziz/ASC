'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  createRoleDefinitionWithPermissions,
  deleteRoleDefinition,
  updateRoleDefinitionWithPermissions,
} from '@/server/actions/roles';
import styles from './roles-permissions.module.css';

type RoleRow = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  is_active: boolean;
};

type PermissionRow = {
  code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
};

type RolePermissionLink = {
  role_id: string;
  permission_code: string;
};

type RolesPermissionsClientProps = {
  roles: RoleRow[];
  permissions: PermissionRow[];
  links: RolePermissionLink[];
};

type RoleDraft = {
  id: string | null;
  code: string;
  name_ar: string;
  name_en: string;
  description: string;
  is_active: boolean;
  permission_codes: string[];
};

function buildDraft(role: RoleRow | null, roleLinks: RolePermissionLink[]): RoleDraft {
  if (!role) {
    return {
      id: null,
      code: '',
      name_ar: '',
      name_en: '',
      description: '',
      is_active: true,
      permission_codes: [],
    };
  }

  return {
    id: role.id,
    code: role.code,
    name_ar: role.name_ar,
    name_en: role.name_en || '',
    description: role.description || '',
    is_active: role.is_active,
    permission_codes: roleLinks
      .filter(link => link.role_id === role.id)
      .map(link => link.permission_code)
      .sort(),
  };
}

function groupLabelFromPermission(code: string) {
  const [prefix] = code.split('.');
  const labels: Record<string, string> = {
    people: 'People',
    memberships: 'Memberships',
    roles: 'Roles',
    settings: 'System Settings',
    staff: 'Staff',
    audit: 'Audit',
    auth: 'Account Provisioning',
    sports: 'Sports Catalog',
    facilities: 'Facilities',
    players: 'Players',
    training_groups: 'Training Groups',
    cms: 'CMS',
  };

  return labels[prefix] || prefix;
}

export function RolesPermissionsClient({ roles, permissions, links }: RolesPermissionsClientProps) {
  const router = useRouter();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const [draft, setDraft] = useState<RoleDraft>(() => buildDraft(roles[0] ?? null, links));
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const groupedPermissions = useMemo(() => {
    const groups = new Map<string, PermissionRow[]>();

    permissions.forEach(permission => {
      const label = groupLabelFromPermission(permission.code);
      const existing = groups.get(label) ?? [];
      existing.push(permission);
      groups.set(label, existing);
    });

    return [...groups.entries()].map(([label, items]) => ({
      label,
      items: items.sort((a, b) => a.code.localeCompare(b.code)),
    }));
  }, [permissions]);

  const selectRole = (role: RoleRow | null) => {
    setSelectedRoleId(role?.id ?? null);
    setDraft(buildDraft(role, links));
    setError('');
  };

  const handleTogglePermission = (permissionCode: string) => {
    setDraft(current => {
      const exists = current.permission_codes.includes(permissionCode);
      return {
        ...current,
        permission_codes: exists
          ? current.permission_codes.filter(code => code !== permissionCode)
          : [...current.permission_codes, permissionCode].sort(),
      };
    });
  };

  const handleCreateNew = () => {
    selectRole(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const payload = {
      code: draft.code,
      name_ar: draft.name_ar,
      name_en: draft.name_en || null,
      description: draft.description || null,
      is_active: draft.is_active,
      permission_codes: draft.permission_codes,
    };

    const result = draft.id
      ? await updateRoleDefinitionWithPermissions(draft.id, payload)
      : await createRoleDefinitionWithPermissions(payload);

    if (!result.success) {
      setError(result.error || 'Unable to save role changes.');
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!draft.id) {
      return;
    }

    const confirmed = window.confirm(
      'Delete this role? This will only work if the role is not assigned to any person.',
    );

    if (!confirmed) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    const result = await deleteRoleDefinition(draft.id);

    if (!result.success) {
      setError(result.error || 'Unable to delete this role.');
      setIsSubmitting(false);
      return;
    }

    const remainingRoles = roles.filter(role => role.id !== draft.id);
    const nextRole = remainingRoles[0] ?? null;

    setSelectedRoleId(nextRole?.id ?? null);
    setDraft(buildDraft(nextRole, links));
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className={styles.layout} dir="rtl">
      <aside className={styles.sidebar}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.title}>الأدوار الحالية</h2>
            <p className={styles.description}>
              اختر دورًا لتعديل صلاحياته أو أنشئ دورًا جديدًا مثل مدير العضويات أو مشرف حمام السباحة.
            </p>
          </div>
          <button type="button" className={styles.primaryButton} onClick={handleCreateNew}>
            إضافة دور جديد
          </button>
        </div>

        <div className={styles.roleList}>
          {roles.map(role => (
            <button
              key={role.id}
              type="button"
              className={`${styles.roleCard} ${selectedRoleId === role.id ? styles.roleCardActive : ''}`}
              onClick={() => selectRole(role)}
            >
              <div className={styles.roleName}>{role.name_ar}</div>
              <div className={styles.roleCode}>{role.code}</div>
              <div className={styles.roleMeta}>{role.description || 'بدون وصف إضافي'}</div>
              <span className={`${styles.statusPill} ${role.is_active ? styles.statusActive : styles.statusInactive}`}>
                {role.is_active ? 'نشط' : 'غير نشط'}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className={styles.editor}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 className={styles.title}>{draft.id ? 'تعديل الدور والصلاحيات' : 'إنشاء دور جديد'}</h2>
            <p className={styles.description}>
              الدور هو ملف الوصول. الصلاحيات هي الأكواد الفعلية التي تسمح بقراءة أو إنشاء أو تعديل البيانات.
            </p>
          </div>
        </div>

        <div className={styles.note}>
          إذا احتجت قدرة جديدة غير موجودة في القائمة، فهذا يعني أننا نحتاج إضافة <strong>permission code</strong> جديد في قاعدة البيانات والكود،
          وليس فقط إنشاء دور جديد.
        </div>

        {error ? <div className={styles.error}>{error}</div> : null}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Role Code</label>
              <input
                className={styles.input}
                value={draft.code}
                onChange={event => setDraft(current => ({ ...current, code: event.target.value }))}
                placeholder="membership_manager"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>الاسم العربي</label>
              <input
                className={styles.input}
                value={draft.name_ar}
                onChange={event => setDraft(current => ({ ...current, name_ar: event.target.value }))}
                placeholder="مدير العضويات"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>English Name</label>
              <input
                className={styles.input}
                value={draft.name_en}
                onChange={event => setDraft(current => ({ ...current, name_en: event.target.value }))}
                placeholder="Membership Manager"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>الحالة</label>
              <div className={styles.switchRow}>
                <input
                  id="role-active"
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={event => setDraft(current => ({ ...current, is_active: event.target.checked }))}
                />
                <label htmlFor="role-active">الدور نشط ومتاح للاستخدام</label>
              </div>
            </div>

            <div className={styles.fullField}>
              <label className={styles.label}>الوصف</label>
              <textarea
                className={styles.textarea}
                value={draft.description}
                onChange={event => setDraft(current => ({ ...current, description: event.target.value }))}
                placeholder="مثال: يدير ملفات العضويات والتجديدات والمتابعة اليومية."
              />
            </div>
          </div>

          <div className={styles.permissionGroups}>
            {groupedPermissions.map(group => (
              <section key={group.label} className={styles.permissionGroup}>
                <div className={styles.permissionGroupHeader}>
                  <h3 className={styles.permissionGroupTitle}>{group.label}</h3>
                  <span className={styles.permissionGroupCount}>
                    {
                      group.items.filter(item => draft.permission_codes.includes(item.code)).length
                    } / {group.items.length} selected
                  </span>
                </div>

                <div className={styles.permissionList}>
                  {group.items.map(permission => (
                    <label key={permission.code} className={styles.permissionItem}>
                      <input
                        type="checkbox"
                        checked={draft.permission_codes.includes(permission.code)}
                        onChange={() => handleTogglePermission(permission.code)}
                      />
                      <span className={styles.permissionText}>
                        <span className={styles.permissionName}>{permission.name_ar}</span>
                        <span className={styles.permissionCode}>{permission.code}</span>
                        <span className={styles.permissionDescription}>
                          {permission.description || permission.name_en || 'No additional description.'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className={styles.actions}>
            {draft.id ? (
              <button type="button" className={styles.dangerButton} onClick={handleDelete} disabled={isSubmitting}>
                حذف الدور
              </button>
            ) : null}
            <button type="button" className={styles.secondaryButton} onClick={() => selectRole(roles.find(role => role.id === selectedRoleId) ?? null)}>
              إعادة ضبط
            </button>
            <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
              {isSubmitting ? 'جارٍ الحفظ...' : draft.id ? 'حفظ التعديلات' : 'إنشاء الدور'}
            </button>
          </div>
        </form>

        {roles.length === 0 ? (
          <div className={styles.emptyState}>
            لا توجد أدوار مسجلة بعد. ابدأ بإنشاء أول دور ثم اختر الصلاحيات المناسبة له.
          </div>
        ) : null}
      </section>
    </div>
  );
}

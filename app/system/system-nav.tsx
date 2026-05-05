'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ROUTES } from '@/lib/constants/routes';
import styles from './layout.module.css';

const navItems = [
  { href: ROUTES.system.people, label: 'الأشخاص' },
  { href: ROUTES.system.memberships, label: 'العضويات' },
  { href: ROUTES.system.staff, label: 'الموظفين' },
  { href: ROUTES.system.roles, label: 'الأدوار والصلاحيات' },
  { href: ROUTES.system.sportsSettings, label: 'إعدادات الألعاب' },
  { href: ROUTES.system.pricingPlans, label: 'خطط الأسعار' },
  { href: ROUTES.system.subscriptions, label: 'الاشتراكات المالية' },
  { href: ROUTES.system.sportsPlayers, label: 'سجل اللاعبين' },
  { href: ROUTES.system.medicalApprovals, label: 'إدارة الموافقات الطبية' },
  { href: ROUTES.system.trainingGroups, label: 'المجموعات التدريبية' },
  { href: ROUTES.system.attendance, label: 'حضور وانصراف التدريب' },
  { href: ROUTES.system.facilitiesSchedule, label: 'جدول المنشآت' },
  { href: ROUTES.system.facilitiesSettings, label: 'إعدادات المنشآت' },
  { href: ROUTES.system.cmsArticles, label: 'إدارة الأخبار والمقالات' },
  { href: ROUTES.system.cmsCategories, label: 'تصنيفات المحتوى' },
  { href: ROUTES.system.cmsMedia, label: 'مكتبة الوسائط' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SystemNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.navLinks} aria-label="System sections">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

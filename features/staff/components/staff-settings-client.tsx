'use client';

import { useState } from 'react';
import { SettingsCategories } from './settings-categories';
import { SettingsSubcategories } from './settings-subcategories';
import { SettingsGroups } from './settings-groups';
import { SettingsJobs } from './settings-jobs';
import styles from './staff-settings.module.css';

type GenericRow = Record<string, unknown>;

type GroupRoleOption = {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  is_active: boolean;
};

type StaffGroupRow = {
  id: string;
  name: string;
  description: string | null;
  role_id: string | null;
  is_active: boolean;
  role?: GroupRoleOption | null;
};

interface StaffSettingsClientProps {
  categories: GenericRow[];
  subcategories: GenericRow[];
  groups: StaffGroupRow[];
  jobs: GenericRow[];
  roleOptions: GroupRoleOption[];
}

export function StaffSettingsClient({ categories, subcategories, groups, jobs, roleOptions }: StaffSettingsClientProps) {
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories' | 'groups' | 'jobs'>('categories');

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'categories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          فئات الموظفين (الأقسام)
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'subcategories' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('subcategories')}
        >
          الفئات الفرعية
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'groups' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          مجموعات الصلاحيات
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'jobs' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('jobs')}
        >
          الوظائف التشغيلية
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'categories' && <SettingsCategories initialData={categories} />}
        {activeTab === 'subcategories' && <SettingsSubcategories initialData={subcategories} categories={categories} />}
        {activeTab === 'groups' && <SettingsGroups initialData={groups} roleOptions={roleOptions} />}
        {activeTab === 'jobs' && <SettingsJobs initialData={jobs} categories={categories} subcategories={subcategories} groups={groups} />}
      </div>
    </div>
  );
}

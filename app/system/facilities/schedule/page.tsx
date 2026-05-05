import { getFacilitySchedule } from '@/server/actions/facilities/get-schedule';
import { FacilityScheduleClient } from '@/features/facilities/components/facility-schedule-client';
import workspace from '@/features/system/components/workspace.module.css';

export default async function FacilitySchedulePage() {
  const res = await getFacilitySchedule();

  if (!res.success) {
    return (
      <div className={workspace.page} dir="rtl">
        <section className={workspace.surface}>
          <div style={{ color: 'red', padding: '2rem', textAlign: 'center' }}>
            {res.error}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={workspace.page} dir="rtl">
      <div className={workspace.header}>
        <div className={workspace.headerTitle}>
          <h1>جدول إشغال المنشآت الرياضية</h1>
          <p>عرض المواعيد المحجوزة والأوقات المتاحة لكل منشأة وحارة رياضية على مدار الساعة</p>
        </div>
      </div>
      <section className={workspace.surface}>
        <FacilityScheduleClient initialData={res.data!} />
      </section>
    </div>
  );
}

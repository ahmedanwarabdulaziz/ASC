'use client';

import { useState } from 'react';
import styles from '@/features/sports/components/sports-settings.module.css';

interface FacilityScheduleClientProps {
  initialData: {
    facilities: any[];
    areas: any[];
    sessions: any[];
    operatingHours: any[];
    exceptions: any[];
  };
}

const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function FacilityScheduleClient({ initialData }: FacilityScheduleClientProps) {
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  const activeFacilities = initialData.facilities.filter(f => f.is_active);
  const facilityAreas = initialData.areas.filter(a => a.facility_id === selectedFacilityId && a.is_active);
  
  // Auto-select first area when facility changes
  if (selectedFacilityId && facilityAreas.length > 0 && !selectedAreaId && !facilityAreas.find(a => a.id === selectedAreaId)) {
    // We shouldn't setState in render directly, but we can handle it in the UI or use a default.
    // Instead of auto-selecting, we'll just handle it gracefully.
  }

  const currentAreaId = selectedAreaId || (facilityAreas.length > 0 ? 'all' : '');

  // Filter sessions for the current area or all areas in this facility
  const areaSessions = currentAreaId === 'all'
    ? initialData.sessions.filter(s => facilityAreas.some(a => a.id === s.facility_area_id))
    : initialData.sessions.filter(s => s.facility_area_id === currentAreaId);

  // Helper to format hour
  const formatHour = (h: number) => `${h.toString().padStart(2, '0')}:00`;

  // Helper to check if sessions cover a specific cell (day, hour)
  const getSessionsForCell = (day: number, hour: number) => {
    return areaSessions.filter(s => {
      if (s.day_of_week !== day) return false;
      const startHour = parseInt(s.start_time.split(':')[0], 10);
      const endHour = parseInt(s.end_time.split(':')[0], 10);
      const endMinute = parseInt(s.end_time.split(':')[1], 10);
      
      const effectiveEndHour = (endHour === 0 && endMinute === 0) ? 24 : endHour;
      const adjustedEndHour = endMinute === 0 ? effectiveEndHour - 1 : effectiveEndHour;
      return hour >= startHour && hour <= adjustedEndHour;
    });
  };

  // Helper to check operating status for a cell
  const getOperatingStatus = (day: number, hour: number) => {
    if (!selectedFacilityId) return { status: 'available' };

    // Find all rules for this facility and this day
    const dayRules = initialData.operatingHours.filter(h => h.facility_id === selectedFacilityId && h.day_of_week === day);
    
    // If no rules exist at all for this day, we default to closed
    if (dayRules.length === 0) return { status: 'closed', reason: 'خارج أوقات العمل' };

    // Check if hour falls within any rule
    const rule = dayRules.find(r => {
      const startHour = parseInt(r.start_time.split(':')[0], 10);
      const endHour = parseInt(r.end_time.split(':')[0], 10);
      const endMinute = parseInt(r.end_time.split(':')[1], 10);
      
      const effectiveEndHour = (endHour === 0 && endMinute === 0) ? 24 : endHour;
      const adjustedEndHour = endMinute === 0 ? effectiveEndHour - 1 : effectiveEndHour;
      return hour >= startHour && hour <= adjustedEndHour;
    });

    if (rule) {
      return { status: rule.status, reason: rule.status === 'maintenance' ? 'صيانة دورية' : 'مغلق' };
    }

    // If hour is not covered by any rule, it's closed by default
    return { status: 'closed', reason: 'خارج أوقات العمل' };
  };

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.content}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ flex: 1 }}>
            <label className={styles.label} style={{display: 'block', marginBottom: '0.5rem'}}>المنشأة الرياضية</label>
            <select 
              className={styles.input} 
              value={selectedFacilityId}
              onChange={(e) => {
                setSelectedFacilityId(e.target.value);
                setSelectedAreaId(''); // reset area on facility change
              }}
            >
              <option value="">-- اختر المنشأة --</option>
              {activeFacilities.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.label} style={{display: 'block', marginBottom: '0.5rem'}}>المكان / الحارة / الجزء</label>
            <select 
              className={styles.input} 
              value={currentAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              disabled={!selectedFacilityId || facilityAreas.length === 0}
            >
              {facilityAreas.length === 0 && <option value="">لا توجد أجزاء أو حارات مسجلة</option>}
              {facilityAreas.length > 0 && <option value="all">المنشأة بالكامل (الكل)</option>}
              {facilityAreas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        {selectedFacilityId && facilityAreas.length > 0 && (
          <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <table style={{ width: '100%', minWidth: '800px', borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1rem', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderLeft: '1px solid #e2e8f0', width: '80px' }}>الساعة</th>
                  {DAYS.map((day, idx) => (
                    <th key={idx} style={{ padding: '1rem', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', borderLeft: idx < DAYS.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map(hour => (
                  <tr key={hour}>
                    <td style={{ padding: '0.5rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.85rem', color: '#475569' }}>
                      {formatHour(hour)}
                    </td>
                    {DAYS.map((_, dayIdx) => {
                      const sessions = getSessionsForCell(dayIdx, hour);
                      const opStatus = getOperatingStatus(dayIdx, hour);
                      
                      return (
                        <td key={dayIdx} style={{ 
                          padding: '0.25rem', 
                          borderBottom: '1px solid #e2e8f0', 
                          borderLeft: dayIdx < DAYS.length - 1 ? '1px solid #e2e8f0' : 'none',
                          height: '60px',
                          verticalAlign: 'top',
                          background: opStatus.status === 'maintenance' ? '#fef08a' : opStatus.status === 'closed' ? '#fee2e2' : '#f0fdf4'
                        }}>
                          {sessions.length > 0 ? (
                            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto', maxHeight: '120px' }}>
                              {sessions.map(session => (
                                <div key={session.id} style={{ 
                                  background: '#dbeafe', 
                                  borderLeft: '4px solid #2563eb',
                                  padding: '0.25rem', 
                                  borderRadius: '4px',
                                  fontSize: '0.7rem',
                                  color: '#1e3a8a',
                                  flexShrink: 0
                                }}>
                                  <strong style={{ display: 'block', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {session.training_groups?.name}
                                  </strong>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.65rem' }}>{session.start_time.substring(0, 5)} - {session.end_time.substring(0, 5)}</span>
                                    {currentAreaId === 'all' && (
                                      <span style={{ color: '#3b82f6', fontSize: '0.6rem', fontWeight: 'bold' }}>
                                        {facilityAreas.find(a => a.id === session.facility_area_id)?.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : opStatus.status !== 'available' ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span style={{ 
                                  color: opStatus.status === 'maintenance' ? '#854d0e' : '#991b1b', 
                                  fontSize: '0.7rem',
                                  fontWeight: opStatus.status === 'maintenance' ? 'bold' : 'bold'
                                }}>
                                  {opStatus.reason}
                                </span>
                            </div>
                          ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <span style={{ color: '#166534', fontSize: '0.7rem', fontWeight: 'bold' }}>متاح</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedFacilityId && facilityAreas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <p>لا توجد حارات أو أجزاء مسجلة لهذه المنشأة.</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>يمكنك إضافتها من شاشة (إعدادات المنشآت).</p>
          </div>
        )}

        {selectedFacilityId && initialData.exceptions && initialData.exceptions.length > 0 && (
          <div style={{ marginTop: '2rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '1rem' }}>
            <h3 style={{ color: '#991b1b', marginBottom: '1rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ تنبيه: إغلاقات استثنائية قادمة لهذه المنشأة
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {initialData.exceptions.filter(e => e.facility_id === selectedFacilityId).map(e => (
                <li key={e.id} style={{ fontSize: '0.9rem', color: '#b91c1c', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <strong>{new Date(e.exception_date).toLocaleDateString('ar-EG')}</strong>
                  <span>({e.start_time.substring(0,5)} - {e.end_time.substring(0,5)})</span>
                  <span style={{ background: '#fee2e2', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{e.status === 'maintenance' ? 'صيانة استثنائية' : 'مغلق'}</span>
                  {e.notes && <span>السبب: {e.notes}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

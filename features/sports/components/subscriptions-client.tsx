'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateSubscriptionsForMonth, confirmSubscriptionPayment } from '@/server/actions/sports/subscriptions';
import styles from './sports-settings.module.css';

interface SubscriptionsClientProps {
  initialData: any[];
  currentMonth: string;
}

export function SubscriptionsClient({ initialData, currentMonth }: SubscriptionsClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const [payingSubscriptionId, setPayingSubscriptionId] = useState<string | null>(null);

  const filteredSubscriptions = initialData.filter(s => {
    if (filterStatus && s.payment_status !== filterStatus) return false;
    return true;
  });

  const handleGenerate = async () => {
    if (!confirm(`هل أنت متأكد من إصدار المطالبات المالية لشهر ${selectedMonth}؟`)) return;
    setIsSubmitting(true);
    setError('');
    
    const res = await generateSubscriptionsForMonth(selectedMonth);
    if (res.success) {
      alert(`تم إصدار ${res.count} مطالبة بنجاح.`);
      router.refresh();
    } else {
      setError(res.error || 'خطأ في الإصدار');
    }
    setIsSubmitting(false);
  };

  const handleConfirmPayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingSubscriptionId) return;
    
    setIsSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const receiptNumber = formData.get('receiptNumber') as string;
    
    const res = await confirmSubscriptionPayment(payingSubscriptionId, receiptNumber);
    if (res.success) {
      setPayingSubscriptionId(null);
      router.refresh();
    } else {
      setError(res.error || 'خطأ في تأكيد الدفع');
    }
    setIsSubmitting(false);
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.content}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className={styles.title} style={{ marginBottom: '0.5rem' }}>إدارة الاشتراكات المالية</h2>
            <p style={{ color: '#64748b' }}>إصدار المطالبات الشهرية للمجموعات التدريبية وتأكيد الدفع</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px' }}>تغيير الشهر:</label>
              <form action={() => router.push(`/system/sports/subscriptions?month=${selectedMonth}`)} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="month" 
                  className={styles.input} 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                />
                <button type="submit" className={styles.buttonSecondary}>عرض</button>
              </form>
            </div>
            <button 
              className={styles.buttonPrimary} 
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              إصدار مطالبات الشهر الحالي
            </button>
          </div>
        </div>

        {renderError()}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <select 
            className={styles.input} 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="">-- كل الحالات --</option>
            <option value="pending">معلق (غير مدفوع)</option>
            <option value="paid">مدفوع</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>

        <table className={styles.table}>
          <thead>
            <tr>
              <th>رقم المطالبة</th>
              <th>اللاعب</th>
              <th>المجموعة / اللعبة</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubscriptions.map(sub => {
              const enrollment = sub.training_group_enrollments;
              const person = enrollment?.sport_players?.people;
              const group = enrollment?.training_groups;
              return (
                <tr key={sub.id}>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{sub.id.substring(0,8)}</span>
                  </td>
                  <td>
                    <div style={{fontWeight: 600}}>{person?.first_name} {person?.second_name} {person?.last_name}</div>
                    <div style={{fontSize: '0.8rem', color: '#64748b'}}>{person?.national_id || '-'}</div>
                  </td>
                  <td>
                    {group?.name}
                    <div style={{fontSize: '0.8rem', color: '#64748b'}}>{group?.sports?.name}</div>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{sub.amount} ج.م</td>
                  
                  {payingSubscriptionId === sub.id ? (
                    <td colSpan={2}>
                      <form onSubmit={handleConfirmPayment} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input type="text" name="receiptNumber" className={styles.input} placeholder="رقم الإيصال" required disabled={isSubmitting} />
                        <button type="submit" className={styles.buttonPrimary} disabled={isSubmitting}>تأكيد الدفع</button>
                        <button type="button" className={styles.buttonSecondary} onClick={() => setPayingSubscriptionId(null)}>إلغاء</button>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td>
                        <span style={{
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          background: sub.payment_status === 'paid' ? '#dcfce7' : (sub.payment_status === 'cancelled' ? '#fee2e2' : '#fef08a'),
                          color: sub.payment_status === 'paid' ? '#166534' : (sub.payment_status === 'cancelled' ? '#991b1b' : '#854d0e'),
                        }}>
                          {sub.payment_status === 'paid' ? 'مدفوع' : (sub.payment_status === 'cancelled' ? 'ملغي' : 'غير مدفوع')}
                        </span>
                        {sub.payment_status === 'paid' && (
                          <div style={{fontSize: '0.75rem', color: '#64748b', marginTop: '4px'}}>إيصال: {sub.receipt_number}</div>
                        )}
                      </td>
                      <td>
                        {sub.payment_status === 'pending' && (
                          <button 
                            className={styles.buttonSecondary} 
                            onClick={() => setPayingSubscriptionId(sub.id)}
                          >
                            تسجيل الدفع
                          </button>
                        )}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
            {filteredSubscriptions.length === 0 && (
              <tr><td colSpan={6} style={{textAlign: 'center', padding: '2rem'}}>لا توجد مطالبات مالية مسجلة لهذا الشهر</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

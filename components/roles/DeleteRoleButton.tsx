'use client';

import { useTransition } from 'react';
import { deleteRoleDefinition } from '@/features/roles/mutations';

export default function DeleteRoleButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm('رسالة تأكيد: هل أنت متأكد من حذف هذا الدور التعريفي بشكل نهائي؟ ستيم إزالة كافة الحقول المرتبطة به.')) {
      startTransition(async () => {
        const res = await deleteRoleDefinition(id);
        if (res?.error) {
          alert('تعذر الحذف: ' + res.error);
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      className="icon-btn delete-icon" 
      title="حذف النهائي للدور"
      disabled={isPending}
      style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? 'not-allowed' : 'pointer' }}
    >
      {isPending ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>...</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      )}
    </button>
  );
}

'use client'

import { useTransition } from 'react'
import { deleteMembershipAction } from '@/features/memberships/mutations'

export default function DeleteMembershipBtn({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من أرشفة وإلغاء هذه العضوية؟ النظام سيحتفظ بكافة سجلاتها التاريخية ولن يتم حذفها نهائياً.')) {
      startTransition(async () => {
        const result = await deleteMembershipAction(id);
        if (result.error) {
           alert(result.error);
        }
      });
    }
  }

  return (
    <button 
      onClick={handleDelete} 
      className="icon-btn" 
      title="أرشفة / إلغاء العضوية"
      disabled={isPending}
      style={{ opacity: isPending ? 0.5 : 1, cursor: isPending ? 'not-allowed' : 'pointer', background: 'transparent', border: 'none' }}
    >
      {isPending ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>...</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      )}
    </button>
  )
}

'use client'

import { useTransition } from 'react'
import { requestSeparationAction } from '@/features/memberships/mutations'

export default function DeleteDependentBtn({ linkId, membershipId, isPrincipal }: { linkId: string, membershipId: string, isPrincipal: boolean }) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (isPrincipal) {
        alert('لا يمكنك فصل العضو الرئيسي. يجب التوجه للوحة العضويات لإلغاء العضوية كاملة.');
        return;
    }
    
    if (confirm('هل تود تقديم طلب رسمي بفصل هذا التابع لاستخراج عضوية مستقلة له؟ سيتم تحويل الطلب للإدارة للمراجعة.')) {
      startTransition(async () => {
        const result = await requestSeparationAction(linkId, membershipId);
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
      title={isPrincipal ? "لا يمكن فصل العضو الرئيسي" : "إلغاء وفصل التابع"}
      disabled={isPending || isPrincipal}
      style={{ 
        opacity: (isPending || isPrincipal) ? 0.5 : 1, 
        cursor: (isPending || isPrincipal) ? 'not-allowed' : 'pointer', 
        background: 'transparent', 
        border: 'none' 
      }}
    >
      {isPending ? (
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>...</span>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
           <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
           <circle cx="9" cy="7" r="4" />
           <line x1="19" y1="8" x2="23" y2="12" />
           <line x1="23" y1="8" x2="19" y2="12" />
        </svg>
      )}
    </button>
  )
}

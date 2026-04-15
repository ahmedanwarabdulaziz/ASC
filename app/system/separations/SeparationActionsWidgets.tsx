'use client'

import { useTransition } from 'react'
import { 
  adminApproveSeparationAction, 
  confirmSeparationPaymentAction 
} from '@/features/memberships/mutations'
import { useFormState } from 'react-dom'
import { boardApproveSeparationAction, completeSeparationAction } from '@/features/memberships/mutations'

export default function SeparationActionsWidgets({ request }: { request: Record<string, unknown> }) {
  const [isPending, startTransition] = useTransition()

  // For Admin Approval
  const handleAdminApprove = () => {
    if (confirm('تأكيد الموافقة الإدارية على هذا الطلب ورفعه لمجلس الإدارة؟')) {
      startTransition(async () => {
        const res = await adminApproveSeparationAction(request.id)
        if (!res.success) alert(res.error)
      })
    }
  }

  // For Payment
  const handlePayment = () => {
    if (confirm('تأكيد سداد مصاريف الفصل؟')) {
      startTransition(async () => {
        const res = await confirmSeparationPaymentAction(request.id)
        if (!res.success) alert(res.error)
      })
    }
  }

  return (
    <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
      {request.status === 'draft' && (
        <button onClick={handleAdminApprove} disabled={isPending} className="btn btn-sm" style={{ background: '#3b82f6', color: 'white' }}>
          موافقة إدارية
        </button>
      )}

      {request.status === 'admin_approved' && (
        <form action={boardApproveSeparationAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <input type="hidden" name="request_id" value={request.id} />
          <input type="text" name="decision_number" placeholder="رقم قرار المجلس" required className="input" style={{ padding: '0.25rem', fontSize: '0.8rem' }} />
          <input type="date" name="meeting_date" required className="input" style={{ padding: '0.25rem', fontSize: '0.8rem' }} />
          <button type="submit" className="btn btn-sm" style={{ background: '#8b5cf6', color: 'white' }}>تسجيل قرار المجلس</button>
        </form>
      )}

      {request.status === 'board_approved' && (
        <button onClick={handlePayment} disabled={isPending} className="btn btn-sm" style={{ background: '#10b981', color: 'white' }}>
          تأكيد إيصال السداد
        </button>
      )}

      {request.status === 'payment_confirmed' && (
        <form action={completeSeparationAction} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
           <input type="hidden" name="request_id" value={request.id} />
           <input type="text" name="new_membership_number" placeholder="رقم الملف الجديد المستقل" required className="input" style={{ padding: '0.25rem', fontSize: '0.8rem' }} />
           <button type="submit" className="btn btn-sm" style={{ background: '#0f172a', color: 'white' }}>إصدار العضوية المنفصلة نهائياً</button>
        </form>
      )}
    </div>
  )
}

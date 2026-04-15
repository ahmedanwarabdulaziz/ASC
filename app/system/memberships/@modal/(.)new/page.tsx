'use client'

import Modal from '@/components/ui/Modal'
import EnrollmentWizard from '../../new/EnrollmentWizard'
import { useRouter } from 'next/navigation'

export default function NewMembershipModal() {
  const router = useRouter()
  return (
    <Modal maxWidth="900px" onClose={() => router.back()}>
      <div className="page-header" style={{ marginBottom: '1.5rem', textAlign: 'right' }}>
        <h2 className="page-title" style={{ fontSize: '1.5rem', marginBottom: 0 }}>إنشاء اشتراك جديد</h2>
        <span style={{color: 'var(--text-muted)'}}>New Membership Wizard</span>
      </div>
      <EnrollmentWizard />
    </Modal>
  )
}

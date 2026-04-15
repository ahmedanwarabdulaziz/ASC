import EnrollmentWizard from './EnrollmentWizard'

export default function NewMembershipPage() {
  return (
    <div className="page-container">
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>معالج تسجيل عضوية جديدة</h1>
        <p style={{ color: 'var(--text-muted)' }}>Membership Enrollment Wizard</p>
      </div>

      <div className="auth-card" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', borderRadius: '1rem' }}>
        <EnrollmentWizard />
      </div>
    </div>
  )
}

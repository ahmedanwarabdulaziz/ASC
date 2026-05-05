import styles from '@/features/memberships/components/add-membership-modal.module.css';

export default function Loading() {
  return (
    <div className={styles.overlay}>
      <div 
        className={styles.modal} 
        style={{
          padding: '4rem',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <div style={{ color: '#1e452b', fontSize: '1.25rem', fontWeight: 600 }}>
          جاري التحميل... (Loading...)
        </div>
      </div>
    </div>
  );
}

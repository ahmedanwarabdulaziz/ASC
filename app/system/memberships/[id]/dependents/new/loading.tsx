export default function AddDependentLoading() {
  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          backgroundColor: 'white',
          boxShadow: '0 24px 48px rgba(15, 23, 42, 0.12)',
          padding: '2rem',
        }}
        dir="rtl"
      >
        <div
          style={{
            width: '10rem',
            height: '1.5rem',
            borderRadius: '9999px',
            backgroundColor: '#e2e8f0',
            marginBottom: '1rem',
          }}
        />
        <div
          style={{
            width: '100%',
            height: '3rem',
            borderRadius: '12px',
            backgroundColor: '#f1f5f9',
            marginBottom: '0.75rem',
          }}
        />
        <div
          style={{
            width: '100%',
            height: '3rem',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
          }}
        />
      </div>
    </div>
  );
}

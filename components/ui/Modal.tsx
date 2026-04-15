'use client';
import { useRouter } from 'next/navigation';
import { MouseEventHandler, useCallback, useRef } from 'react';

export default function Modal({ children, maxWidth = '600px', onClose }: { children: React.ReactNode, maxWidth?: string, onClose?: () => void }) {
  const router = useRouter();
  const overlay = useRef<HTMLDivElement>(null);

  const onDismiss = useCallback(() => {
    if (onClose) {
       onClose();
    } else {
       router.back();
    }
  }, [router, onClose]);

  const onClick: MouseEventHandler = useCallback((e) => {
    if (e.target === overlay.current) {
      onDismiss();
    }
  }, [onDismiss]);

  return (
    <div 
      ref={overlay} 
      onClick={onClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem'
      }}
    >
      <div 
        style={{
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          width: '100%',
          maxWidth: maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <button 
          onClick={onDismiss}
          style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', zIndex: 10, color: 'var(--text-muted)' }}
          aria-label="Close modal"
        >
          ✕
        </button>
        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { resolveReturnTo } from '@/lib/utils/return-to';
import styles from './route-modal.module.css';

type RouteModalProps = {
  children: React.ReactNode;
  variant?: 'modal' | 'drawer';
  maxWidth?: string;
  fallbackHref?: string;
};

export function RouteModal({
  children,
  variant = 'modal',
  maxWidth = '600px',
  fallbackHref,
}: RouteModalProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedFallbackHref = fallbackHref
    ? resolveReturnTo(searchParams.get('returnTo'), fallbackHref)
    : null;

  function onDismiss() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    if (resolvedFallbackHref) {
      router.push(resolvedFallbackHref);
      return;
    }

    router.back();
  }

  return (
    <div
      className={`${styles.overlay} ${variant === 'drawer' ? styles.drawerOverlay : styles.modalOverlay}`}
      onClick={onDismiss}
    >
      <div
        className={`${styles.panel} ${variant === 'drawer' ? styles.drawerPanel : styles.modalPanel}`}
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth }}
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onDismiss}
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className={`${styles.body} ${variant === 'drawer' ? styles.drawerBody : styles.modalBody}`}>
          {children}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { EditPersonForm } from './edit-person-form';
import styles from './add-person-modal.module.css'; // Reusing modal styles
import type { Person } from '@/types/database';

interface EditPersonModalInterceptorProps {
  person: Person;
}

export function EditPersonModalInterceptor({ person }: EditPersonModalInterceptorProps) {
  const router = useRouter();

  function close() {
    router.back();
  }

  return (
    <div className={styles.overlay} onClick={close}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <EditPersonForm person={person} onClose={close} />
      </div>
    </div>
  );
}

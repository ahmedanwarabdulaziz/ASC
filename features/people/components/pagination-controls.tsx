'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import styles from './pagination-controls.module.css';

interface PaginationControlsProps {
  totalRecords: number;
  currentPage: number;
  limit: number;
}

export function PaginationControls({ totalRecords, currentPage, limit }: PaginationControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(totalRecords / limit);

  function createPageURL(pageNumber: number | string) {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  }

  function goToPage(pageNumber: number) {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      router.push(createPageURL(pageNumber));
    }
  }

  if (totalPages <= 1) return null;

  return (
    <div className={styles.container} dir="rtl">
      <div className={styles.info}>
        عرض {(currentPage - 1) * limit + 1} إلى {Math.min(currentPage * limit, totalRecords)} من أصل {totalRecords}
      </div>

      <div className={styles.controls} dir="ltr">
        <button
          className={styles.button}
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          Previous
        </button>

        {/* Display page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
          .map((page, index, array) => {
            // Add ellipsis
            if (index > 0 && page - array[index - 1] > 1) {
              return (
                <span key={`ellipsis-${page}`} style={{ padding: '0.5rem' }}>
                  ...
                </span>
              );
            }
            return (
              <button
                key={page}
                className={`${styles.button} ${currentPage === page ? styles.active : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            );
          })}

        <button
          className={styles.button}
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

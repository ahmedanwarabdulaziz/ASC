'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import styles from './search-input.module.css';

export function SearchInput() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSearch = searchParams.get('search') || '';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleChange(value: string) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);

      if (value) {
        params.set('search', value);
        params.set('page', '1');
      } else {
        params.delete('search');
        params.delete('page');
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 400);
  }

  return (
    <div className={styles.searchContainer} dir="rtl" key={`${pathname}:${currentSearch}`}>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="بحث بالرقم القومي أو الاسم..."
        defaultValue={currentSearch}
        onChange={(event) => handleChange(event.target.value)}
      />
      <svg
        className={styles.searchIcon}
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    </div>
  );
}

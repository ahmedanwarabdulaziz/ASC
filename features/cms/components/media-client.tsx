'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { uploadMedia, deleteMedia } from '@/server/actions/cms/media';
import styles from './cms.module.css';
import Image from 'next/image';

interface MediaClientProps {
  initialData: any[];
}

export function MediaClient({ initialData }: MediaClientProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('حجم الملف يجب أن لا يتجاوز 5 ميجابايت.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    const res = await uploadMedia(formData);

    if (res.success) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } else {
      setError(res.error || 'حدث خطأ أثناء الرفع');
    }
    
    setIsUploading(false);
  };

  const handleDelete = async (id: string, fileUrl: string) => {
    if (confirm('هل أنت متأكد من الحذف النهائي؟ سيتوقف هذا الملف عن الظهور في المقالات التي تستخدمه.')) {
      const res = await deleteMedia(id, fileUrl);
      if (res.success) router.refresh();
      else alert(res.error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('تم نسخ الرابط بنجاح!');
  };

  const renderError = () => error && <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container} dir="rtl">
      
      <div className={styles.content} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>رفع ملف جديد</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>الحد الأقصى 5 ميجابايت. الصور والفيديوهات القصيرة.</p>
        </div>
        <div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/*,video/mp4,application/pdf"
          />
          <button 
            className={styles.buttonPrimary} 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? 'جاري الرفع...' : 'اختر ملف للرفع'}
          </button>
        </div>
      </div>

      {renderError()}

      <div className={styles.content}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
          {initialData.map((item) => (
            <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ height: '180px', backgroundColor: '#f8fafc', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.media_type === 'image' ? (
                  <img src={item.file_url} alt={item.file_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                      <polyline points="13 2 13 9 20 9"></polyline>
                    </svg>
                    <span>ملف {item.media_type}</span>
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dir="ltr">
                  {item.file_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                  {Math.round(item.file_size_bytes / 1024)} KB • {new Date(item.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => copyToClipboard(item.file_url)} className={styles.buttonSecondary} style={{ flex: 1, padding: '0.4rem', fontSize: '0.85rem' }}>
                    نسخ الرابط
                  </button>
                  <button onClick={() => handleDelete(item.id, item.file_url)} className={styles.buttonDanger} style={{ padding: '0.4rem', fontSize: '0.85rem' }}>
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
          {initialData.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              لا توجد ملفات في المكتبة حالياً
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

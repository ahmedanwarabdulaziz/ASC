'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { SiteBio } from '@/types';

export default function BioEditPage() {
  const [bio, setBio] = useState<SiteBio | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [formData, setFormData] = useState({
    bio_text: '',
    vision_text: '',
    mission_text: '',
  });

  useEffect(() => {
    checkAuthAndLoadBio();
  }, []);

  const checkAuthAndLoadBio = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(user);
    await loadBio();
  };

  const loadBio = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('site_bio')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

      if (data) {
        setBio(data as SiteBio);
        setFormData({
          bio_text: data.bio_text || '',
          vision_text: data.vision_text || '',
          mission_text: data.mission_text || '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في تحميل السيرة الذاتية');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      setError('');

      if (bio) {
        // Update existing
        const { error } = await supabase
          .from('site_bio')
          .update({
            bio_text: formData.bio_text,
            vision_text: formData.vision_text,
            mission_text: formData.mission_text,
            updated_by: currentUser.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', bio.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('site_bio')
          .insert({
            bio_text: formData.bio_text,
            vision_text: formData.vision_text,
            mission_text: formData.mission_text,
            updated_by: currentUser.id,
          });

        if (error) throw error;
      }

      alert('تم حفظ السيرة الذاتية بنجاح');
      await loadBio();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في حفظ السيرة الذاتية');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black" dir="rtl">
        <Navigation />
        <div className="container mx-auto px-4 py-20">
          <div className="text-center text-white">جاري التحميل...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black" dir="rtl">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">تعديل السيرة الذاتية</h1>
          <p className="text-gray-400">قم بتحديث معلوماتك الشخصية ورؤيتك ورسالتك</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="bg-gray-900/50 border border-yellow-500/20 rounded-xl p-8 space-y-6">
          <div>
            <label className="block text-white font-semibold mb-2">النص التعريفي</label>
            <textarea
              value={formData.bio_text}
              onChange={(e) => setFormData({ ...formData, bio_text: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              rows={6}
              placeholder="اكتب النص التعريفي عنك هنا..."
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">الرؤية</label>
            <textarea
              value={formData.vision_text}
              onChange={(e) => setFormData({ ...formData, vision_text: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              rows={4}
              placeholder="اكتب رؤيتك هنا..."
            />
          </div>

          <div>
            <label className="block text-white font-semibold mb-2">الرسالة</label>
            <textarea
              value={formData.mission_text}
              onChange={(e) => setFormData({ ...formData, mission_text: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-500 focus:outline-none focus:border-yellow-500"
              rows={4}
              placeholder="اكتب رسالتك هنا..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </Button>
            <Button
              onClick={() => router.push('/dashboard/blog')}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              إلغاء
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


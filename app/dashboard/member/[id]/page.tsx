'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Member } from '@/types';
import Link from 'next/link';
import Button from '@/components/Button';

export default function MemberDetail() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.id as string;
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'pending'>('pending');

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    try {
      const memberRef = doc(db, 'members', memberId);
      const memberSnap = await getDoc(memberRef);
      
      if (memberSnap.exists()) {
        const data = {
          id: memberSnap.id,
          ...memberSnap.data(),
          createdAt: memberSnap.data().createdAt?.toDate() || new Date(),
          updatedAt: memberSnap.data().updatedAt?.toDate() || new Date(),
        } as Member;
        
        setMember(data);
        setNotes(data.notes || '');
        setStatus(data.status);
      } else {
        alert('العضو غير موجود');
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error loading member:', error);
      alert('حدث خطأ أثناء تحميل بيانات العضو');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!member) return;

    setSaving(true);
    try {
      const memberRef = doc(db, 'members', memberId);
      await updateDoc(memberRef, {
        notes,
        status,
        updatedAt: new Date(),
      });

      alert('تم الحفظ بنجاح');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving:', error);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-blue">جاري التحميل...</div>
      </div>
    );
  }

  if (!member) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">تفاصيل العضو</h1>
            <Link 
              href="/dashboard"
              className="text-white hover:text-gray-200"
            >
              العودة إلى القائمة
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-blue mb-6">{member.name}</h2>

          <div className="space-y-6">
            {/* Member Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم العضو
                </label>
                <div className="text-gray-900">{member.memberId || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  العنوان
                </label>
                <div className="text-gray-900">{member.address || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الوظيفة
                </label>
                <div className="text-gray-900">{member.job || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الهاتف الأرضي
                </label>
                <div className="text-gray-900">{member.phone || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الجوال
                </label>
                <div className="text-gray-900">{member.mobile || member.phone || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="text-gray-900">{member.email || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الفريق
                </label>
                <div className="text-gray-900">{member.teamName || 'غير مخصص'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ الإضافة
                </label>
                <div className="text-gray-900">
                  {member.createdAt.toLocaleDateString('ar-SA')}
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الحالة
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'inactive' | 'pending')}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              >
                <option value="pending">قيد الانتظار</option>
                <option value="active">نشط</option>
                <option value="inactive">غير نشط</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الملاحظات
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
                placeholder="أضف ملاحظات حول هذا العضو..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
              />
            </div>

            {/* Save Button */}
            <div className="flex gap-4">
              <Button
                onClick={handleSave}
                loading={saving}
              >
                حفظ التغييرات
              </Button>
              <Link href="/dashboard">
                <Button variant="secondary">
                  إلغاء
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


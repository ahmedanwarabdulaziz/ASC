'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { StatusConflict, MemberStatusRecord } from '@/types';
import { getStatusLabel, getStatusColor } from '@/lib/status-utils';

export default function ConflictsPage() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [conflicts, setConflicts] = useState<StatusConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<StatusConflict | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [keepStatusIds, setKeepStatusIds] = useState<string[]>([]);
  const [filterResolved, setFilterResolved] = useState<'all' | 'resolved' | 'unresolved'>('unresolved');
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadConflicts();
  }, [filterResolved]);

  const checkAuthAndLoadConflicts = async () => {
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
    await loadConflicts();
  };

  const loadConflicts = async () => {
    try {
      const resolvedParam = filterResolved === 'all' ? '' : filterResolved === 'resolved' ? 'true' : 'false';
      const url = `/api/conflicts${resolvedParam ? `?resolved=${resolvedParam}` : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (result.conflicts) {
        setConflicts(result.conflicts);
      }
    } catch (error) {
      console.error('Error loading conflicts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;

    if (keepStatusIds.length === 0) {
      alert('الرجاء اختيار الحالات المراد الاحتفاظ بها');
      return;
    }

    try {
      const response = await fetch('/api/conflicts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conflictId: selectedConflict.id,
          keepStatusIds,
          resolutionNotes: resolutionNotes.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.error || 'فشل حل التعارض');
        return;
      }

      alert('تم حل التعارض بنجاح');
      setSelectedConflict(null);
      setKeepStatusIds([]);
      setResolutionNotes('');
      await loadConflicts();
    } catch (error) {
      console.error('Error resolving conflict:', error);
      alert('حدث خطأ أثناء حل التعارض');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">جاري التحميل...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">حل تعارضات الحالات</h1>
            <select
              value={filterResolved}
              onChange={(e) => setFilterResolved(e.target.value as 'all' | 'resolved' | 'unresolved')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="unresolved">غير محلولة</option>
              <option value="resolved">محلولة</option>
              <option value="all">الكل</option>
            </select>
          </div>

          {conflicts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <p className="text-gray-500 text-lg">لا توجد تعارضات</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conflicts.map((conflict) => (
                <div key={conflict.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`px-6 py-4 ${conflict.resolved ? 'bg-green-50 border-r-4 border-green-500' : 'bg-orange-50 border-r-4 border-orange-500'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {conflict.member_name || conflict.member_id}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(conflict.created_at).toLocaleDateString('ar-EG')}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        conflict.resolved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {conflict.resolved ? 'محلول' : 'غير محلول'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">الحالات المتعارضة:</h4>
                    <div className="space-y-3 mb-6">
                      {conflict.statuses?.map((status: MemberStatusRecord) => (
                        <div key={status.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(status.status)}`}>
                                {getStatusLabel(status.status)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(status.created_at).toLocaleDateString('ar-EG')}
                              </span>
                            </div>
                            {!conflict.resolved && (
                              <input
                                type="checkbox"
                                checked={keepStatusIds.includes(status.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setKeepStatusIds([...keepStatusIds, status.id]);
                                  } else {
                                    setKeepStatusIds(keepStatusIds.filter(id => id !== status.id));
                                  }
                                }}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                            )}
                          </div>
                          {status.notes && (
                            <p className="text-sm text-gray-600 mt-2">{status.notes}</p>
                          )}
                          <div className="mt-2 text-xs text-gray-500">
                            {status.updated_by_name || status.updated_by_email}
                            {status.supervisor_code && ` (${status.supervisor_code})`}
                            {status.leader_code && ` (${status.leader_code})`}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!conflict.resolved && (
                      <div className="space-y-4 pt-4 border-t border-gray-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            ملاحظات الحل (اختياري)
                          </label>
                          <textarea
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                            placeholder="أضف ملاحظات حول كيفية حل هذا التعارض..."
                          />
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedConflict(conflict);
                            handleResolveConflict();
                          }}
                          disabled={keepStatusIds.length === 0}
                        >
                          حل التعارض
                        </Button>
                      </div>
                    )}

                    {conflict.resolved && conflict.resolution_notes && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-900 mb-1">ملاحظات الحل:</p>
                        <p className="text-sm text-gray-700">{conflict.resolution_notes}</p>
                        {conflict.resolved_at && (
                          <p className="text-xs text-gray-500 mt-2">
                            تم الحل في: {new Date(conflict.resolved_at).toLocaleDateString('ar-EG')}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}




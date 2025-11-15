'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getCurrentUser, signOut, AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { UserRole } from '@/types';

export default function UsersManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const [newUser, setNewUser] = useState({
    email: '',
    role: 'team_leader' as UserRole,
    displayName: '',
    supervisorId: '',
  });
  const [supervisors, setSupervisors] = useState<any[]>([]);

  // Update supervisorId when currentUser changes and is a supervisor
  useEffect(() => {
    if (currentUser && currentUser.role === 'supervisor' && newUser.role === 'team_leader' && !newUser.supervisorId) {
      setNewUser(prev => ({ ...prev, supervisorId: currentUser.id }));
    }
  }, [currentUser, newUser.role, newUser.supervisorId]);

  useEffect(() => {
    checkAuthAndLoadUsers();
  }, []);

  const checkAuthAndLoadUsers = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // Check permissions
    if (user.role !== 'admin' && user.role !== 'supervisor') {
      router.push('/dashboard');
      return;
    }

    setCurrentUser(user);
    await loadUsers();
    await loadSupervisors();
  };

  const loadSupervisors = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, code')
        .eq('role', 'supervisor')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading supervisors:', error);
        return;
      }

      setSupervisors(data || []);
    } catch (err) {
      console.error('Unexpected error loading supervisors:', err);
    }
  };

  const loadUsers = async () => {
    try {
      // For supervisors, only show themselves and their team leaders
      if (currentUser && currentUser.role === 'supervisor') {
        // Get the supervisor's own record
        const { data: supervisorData, error: supervisorError } = await supabase
          .from('users')
          .select(`
            *,
            supervisor:supervisor_id (
              id,
              email,
              display_name,
              code
            )
          `)
          .eq('id', currentUser.id)
          .single();

        // Get all team leaders under this supervisor
        const { data: leadersData, error: leadersError } = await supabase
          .from('users')
          .select(`
            *,
            supervisor:supervisor_id (
              id,
              email,
              display_name,
              code
            )
          `)
          .eq('role', 'team_leader')
          .eq('supervisor_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (supervisorError || leadersError) {
          console.error('Error loading users:', supervisorError || leadersError);
          setError('فشل تحميل المستخدمين');
          return;
        }

        // Combine supervisor and leaders
        const allUsers = supervisorData ? [supervisorData, ...(leadersData || [])] : (leadersData || []);
        setUsers(allUsers);
      } else {
        // For admins, show all users
        const { data, error: fetchError } = await supabase
          .from('users')
          .select(`
            *,
            supervisor:supervisor_id (
              id,
              email,
              display_name,
              code
            )
          `)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error loading users:', fetchError);
          setError('فشل تحميل المستخدمين');
          return;
        }

        setUsers(data || []);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      if (!currentUser) {
        setError('يجب تسجيل الدخول أولاً');
        setCreating(false);
        return;
      }

      // Check permissions
      if (currentUser.role === 'supervisor' && newUser.role !== 'team_leader') {
        setError('المشرفون يمكنهم إنشاء قادة الفرق فقط');
        setCreating(false);
        return;
      }

      // Validate supervisor for team_leader
      if (newUser.role === 'team_leader' && !newUser.supervisorId) {
        setError('الرجاء اختيار المشرف المسؤول عن قائد الفريق');
        setCreating(false);
        return;
      }

      // Create user via API
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUser.email,
          role: newUser.role,
          displayName: newUser.displayName,
          supervisorId: newUser.role === 'team_leader' ? newUser.supervisorId : null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'فشل إنشاء المستخدم');
        setCreating(false);
        return;
      }

      // Reset form and reload users
      const resetSupervisorId = (currentUser?.role === 'supervisor') ? currentUser.id : '';
      setNewUser({ email: '', role: 'team_leader', displayName: '', supervisorId: resetSupervisorId });
      setShowCreateForm(false);
      await loadUsers();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('حدث خطأ غير متوقع');
    } finally {
      setCreating(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'مدير',
      supervisor: 'مشرف',
      team_leader: 'قائد فريق',
    };
    return labels[role] || role;
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
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">إدارة المستخدمين</h1>
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'supervisor') && (
              <Button
                onClick={() => {
                  const newShowForm = !showCreateForm;
                  setShowCreateForm(newShowForm);
                  // When opening the form, if supervisor, auto-set supervisorId
                  if (newShowForm && currentUser.role === 'supervisor') {
                    setNewUser(prev => ({ ...prev, supervisorId: currentUser.id }));
                  }
                }}
                fullWidth={true}
                size="md"
                className="sm:w-auto"
              >
                {showCreateForm ? 'إلغاء' : 'إضافة مستخدم جديد'}
              </Button>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {showCreateForm && (
            <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white">إضافة مستخدم جديد</h2>
              </div>
              <form onSubmit={handleCreateUser} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                      dir="ltr"
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الدور <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => {
                        const newRole = e.target.value as UserRole;
                        // If supervisor is creating a team leader, auto-set supervisorId to themselves
                        const supervisorId = (currentUser?.role === 'supervisor' && newRole === 'team_leader') 
                          ? currentUser.id 
                          : '';
                        setNewUser({ ...newUser, role: newRole, supervisorId });
                      }}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                      disabled={currentUser?.role === 'supervisor'}
                    >
                      {currentUser?.role === 'admin' && (
                        <>
                          <option value="supervisor">مشرف</option>
                          <option value="team_leader">قائد فريق</option>
                        </>
                      )}
                      {currentUser?.role === 'supervisor' && (
                        <option value="team_leader">قائد فريق</option>
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    placeholder="اسم المستخدم"
                  />
                </div>

                {newUser.role === 'team_leader' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      المشرف المسؤول <span className="text-red-500">*</span>
                    </label>
                    {currentUser?.role === 'supervisor' ? (
                      <div>
                        <input
                          type="text"
                          value={currentUser.displayName || currentUser.email || ''}
                          disabled
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                        />
                        <p className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                          ℹ️ سيتم تعيين قائد الفريق تحت إشرافك تلقائياً
                        </p>
                      </div>
                    ) : (
                      <>
                        <select
                          value={newUser.supervisorId}
                          onChange={(e) => setNewUser({ ...newUser, supervisorId: e.target.value })}
                          required
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
                        >
                          <option value="">اختر المشرف</option>
                          {supervisors.map((supervisor) => (
                            <option key={supervisor.id} value={supervisor.id}>
                              {supervisor.display_name || supervisor.email} {supervisor.code ? `(${supervisor.code})` : ''}
                            </option>
                          ))}
                        </select>
                        {supervisors.length === 0 && (
                          <p className="mt-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3">
                            ⚠️ لا يوجد مشرفين متاحين. يجب إنشاء مشرف أولاً.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {(newUser.role === 'supervisor' || newUser.role === 'team_leader') && (
                  <div className="bg-blue-50 border-r-4 border-blue-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">الكود التلقائي</p>
                        <p className="text-sm text-blue-700">
                          سيتم إنشاء الكود تلقائياً عند إنشاء المستخدم: <strong>{newUser.role === 'supervisor' ? 'SUP' : 'LEAD'}XXX</strong>
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">كلمة المرور الافتراضية</p>
                      <p className="text-sm text-gray-700">
                        كلمة المرور الافتراضية هي <strong className="font-mono">123456</strong> وسيتم إجبار المستخدم على تغييرها في أول تسجيل دخول.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                  <Button
                    type="submit"
                    loading={creating}
                    fullWidth={true}
                    className="sm:flex-1"
                  >
                    إنشاء مستخدم
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowCreateForm(false);
                      const resetSupervisorId = (currentUser?.role === 'supervisor') ? currentUser.id : '';
                      setNewUser({ email: '', role: 'team_leader', displayName: '', supervisorId: resetSupervisorId });
                      setError('');
                    }}
                    fullWidth={true}
                    className="sm:w-auto sm:px-8"
                  >
                    إلغاء
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      البريد الإلكتروني
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الاسم
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الدور
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الكود
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المشرف المسؤول
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      حالة كلمة المرور
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      تاريخ الإنشاء
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                        {user.email}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.display_name || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.code || '-'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.supervisor ? (
                          <span>
                            {user.supervisor.display_name || user.supervisor.email}
                            {user.supervisor.code && <span className="text-gray-500"> ({user.supervisor.code})</span>}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                        {user.must_change_password ? (
                          <span className="text-orange-600 font-semibold">يجب التغيير</span>
                        ) : (
                          <span className="text-green-600">تم التغيير</span>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('ar-EG')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {users.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-6 text-center text-gray-500">
                لا يوجد مستخدمين
              </div>
            ) : (
              users.map((user) => (
                <div key={user.id} className="bg-white rounded-xl shadow-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" dir="ltr">
                        {user.email}
                      </p>
                      {user.display_name && (
                        <p className="text-sm text-gray-600 mt-1">{user.display_name}</p>
                      )}
                    </div>
                    <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full flex-shrink-0 ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    {user.code && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">الكود:</span>
                        <span className="text-gray-900 font-medium">{user.code}</span>
                      </div>
                    )}
                    {user.supervisor && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">المشرف المسؤول:</span>
                        <span className="text-gray-900">
                          {user.supervisor.display_name || user.supervisor.email}
                          {user.supervisor.code && <span className="text-gray-500"> ({user.supervisor.code})</span>}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">حالة كلمة المرور:</span>
                      {user.must_change_password ? (
                        <span className="text-orange-600 font-semibold">يجب التغيير</span>
                      ) : (
                        <span className="text-green-600">تم التغيير</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">تاريخ الإنشاء:</span>
                      <span className="text-gray-900">{new Date(user.created_at).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


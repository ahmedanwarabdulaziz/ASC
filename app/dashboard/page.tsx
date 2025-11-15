'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { MemberStatus } from '@/types';

interface SummaryData {
  totals: {
    statuses: Record<MemberStatus, number>;
    categories: Record<string, number>;
  };
  supervisor: {
    statuses: Record<MemberStatus, number>;
    categories: Record<string, number>;
    user: {
      id: string;
      display_name: string;
      code?: string;
    };
  };
  leadersTotal: {
    statuses: Record<MemberStatus, number>;
    categories: Record<string, number>;
  };
  leaders: Array<{
    user: {
      id: string;
      display_name: string;
      code?: string;
      email?: string;
    };
    statuses: Record<MemberStatus, number>;
    categories: Record<string, number>;
  }>;
}

interface LeaderSummaryData {
  statuses: Record<MemberStatus, number>;
  categories: Record<string, number>;
  user: {
    id: string;
    display_name: string;
    code?: string;
  };
}

interface AdminSummaryData {
  totals: {
    statuses: Record<MemberStatus, number>;
    categories: Record<string, number>;
  };
  supervisors: Array<{
    user: {
      id: string;
      display_name: string;
      code?: string;
      email?: string;
    };
    statuses: Record<MemberStatus, number>;
    categories: Record<string, number>;
    leadersTotal: {
      statuses: Record<MemberStatus, number>;
      categories: Record<string, number>;
    };
    leaders: Array<{
      user: {
        id: string;
        display_name: string;
        code?: string;
        email?: string;
      };
      statuses: Record<MemberStatus, number>;
      categories: Record<string, number>;
    }>;
  }>;
}

const statusLabels: Record<MemberStatus, string> = {
  chance: 'فرصة',
  called: 'تم الاتصال',
  will_vote: 'سوف يصوت',
  sure_vote: 'صوت مؤكد',
  voted: 'صوت'
};

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [leaderSummaryData, setLeaderSummaryData] = useState<LeaderSummaryData | null>(null);
  const [adminSummaryData, setAdminSummaryData] = useState<AdminSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const user = await getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }

    setCurrentUser(user);

    // Load summary based on role
    if (user.role === 'supervisor') {
      await loadSummary();
    } else if (user.role === 'team_leader') {
      await loadLeaderSummary();
    } else if (user.role === 'admin') {
      await loadAdminSummary();
    } else {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = await fetch('/api/supervisor/summary');
      if (!response.ok) {
        console.error('Failed to load summary');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderSummary = async () => {
    try {
      const response = await fetch('/api/leader/summary');
      if (!response.ok) {
        console.error('Failed to load leader summary');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setLeaderSummaryData(data);
    } catch (error) {
      console.error('Error loading leader summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminSummary = async () => {
    try {
      const response = await fetch('/api/admin/summary');
      if (!response.ok) {
        console.error('Failed to load admin summary');
        setLoading(false);
        return;
      }

      const data = await response.json();
      setAdminSummaryData(data);
    } catch (error) {
      console.error('Error loading admin summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const SummaryCard = ({ 
    title, 
    statuses, 
    categories,
    showCategories = true
  }: { 
    title: string; 
    statuses: Record<MemberStatus, number>; 
    categories: Record<string, number>;
    showCategories?: boolean;
  }) => {
    const totalStatuses = Object.values(statuses).reduce((a, b) => a + b, 0);
    const totalCategories = Object.values(categories).reduce((a, b) => a + b, 0);

    return (
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-4 break-words">{title}</h3>
        
        {/* Status Cards */}
        <div className={showCategories ? "mb-6" : ""}>
          <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
            الحالات
            <span className="text-blue-600 font-bold">{totalStatuses}</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {(Object.keys(statusLabels) as MemberStatus[]).map((status) => (
              <div
                key={status}
                className="bg-blue-50 rounded-lg p-2 sm:p-3 text-center border border-blue-200"
              >
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{statuses[status] || 0}</div>
                <div className="text-xs sm:text-sm text-gray-600 mt-1">{statusLabels[status]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Cards */}
        {showCategories && (
          <div>
            <h4 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2 flex-wrap">
              التصنيفات
              <span className="text-blue-600 font-bold">{totalCategories}</span>
            </h4>
            {Object.keys(categories).length === 0 ? (
              <p className="text-gray-500 text-sm">لا توجد تصنيفات</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                {Object.entries(categories).map(([category, count]) => (
                  <div
                    key={category}
                    className="bg-green-50 rounded-lg p-2 sm:p-3 text-center border border-green-200"
                  >
                    <div className="text-xl sm:text-2xl font-bold text-green-600">{count}</div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1 truncate" title={category}>
                      {category}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-xl text-blue-600">جاري التحميل...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-4 sm:mb-6 text-center">
            لوحة التحكم
          </h1>

          {currentUser?.role === 'supervisor' && summaryData ? (
            <div className="space-y-4 sm:space-y-6">
              {/* 1. Totals (Supervisor + Leaders) */}
              <SummaryCard
                title="الإجمالي (المشرف + القادة)"
                statuses={summaryData.totals.statuses}
                categories={summaryData.totals.categories}
                showCategories={false}
              />

              {/* 2. Supervisor Alone */}
              <SummaryCard
                title={`المشرف: ${summaryData.supervisor.user.display_name || summaryData.supervisor.user.code || 'غير محدد'}`}
                statuses={summaryData.supervisor.statuses}
                categories={summaryData.supervisor.categories}
              />

              {/* 3. Leaders Total */}
              <SummaryCard
                title="إجمالي القادة"
                statuses={summaryData.leadersTotal.statuses}
                categories={summaryData.leadersTotal.categories}
              />

              {/* 4. Each Leader Individually */}
              {summaryData.leaders.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4">القادة</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {summaryData.leaders.map((leader) => (
                      <SummaryCard
                        key={leader.user.id}
                        title={`${leader.user.display_name || leader.user.code || 'غير محدد'}`}
                        statuses={leader.statuses}
                        categories={leader.categories}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : currentUser?.role === 'team_leader' && leaderSummaryData ? (
            <div className="space-y-4 sm:space-y-6">
              <SummaryCard
                title={`القائد: ${leaderSummaryData.user.display_name || leaderSummaryData.user.code || 'غير محدد'}`}
                statuses={leaderSummaryData.statuses}
                categories={leaderSummaryData.categories}
              />
            </div>
          ) : currentUser?.role === 'admin' && adminSummaryData ? (
            <div className="space-y-4 sm:space-y-6">
              {/* 1. Totals (All Supervisors + All Leaders) */}
              <SummaryCard
                title="الإجمالي (جميع المشرفين + القادة)"
                statuses={adminSummaryData.totals.statuses}
                categories={adminSummaryData.totals.categories}
                showCategories={false}
              />

              {/* 2. Each Supervisor */}
              {adminSummaryData.supervisors.length > 0 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-blue-600 mb-4">المشرفين</h2>
                  <div className="space-y-4 sm:space-y-6">
                    {adminSummaryData.supervisors.map((supervisor) => (
                      <div key={supervisor.user.id} className="space-y-4">
                        {/* Supervisor Alone */}
                        <SummaryCard
                          title={`المشرف: ${supervisor.user?.display_name || supervisor.user?.code || supervisor.user?.email || supervisor.user?.id || 'غير محدد'}`}
                          statuses={supervisor.statuses}
                          categories={supervisor.categories}
                        />

                        {/* Leaders Total for this Supervisor */}
                        <SummaryCard
                          title={`إجمالي قادة ${supervisor.user?.display_name || supervisor.user?.code || supervisor.user?.email || supervisor.user?.id || 'غير محدد'}`}
                          statuses={supervisor.leadersTotal.statuses}
                          categories={supervisor.leadersTotal.categories}
                        />

                        {/* Each Leader Individually */}
                        {supervisor.leaders.length > 0 && (
                          <div className="pr-0 sm:pr-4">
                            <h3 className="text-lg sm:text-xl font-bold text-blue-600 mb-3">
                              قادة {supervisor.user?.display_name || supervisor.user?.code || supervisor.user?.email || supervisor.user?.id || 'غير محدد'}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                              {supervisor.leaders.map((leader, index) => (
                                <SummaryCard
                                  key={leader.user?.id || `leader-${index}`}
                                  title={`${leader.user?.display_name || leader.user?.code || leader.user?.email || leader.user?.id || 'غير محدد'}`}
                                  statuses={leader.statuses}
                                  categories={leader.categories}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <p className="text-gray-600 text-center">
                مرحباً بك في لوحة التحكم
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

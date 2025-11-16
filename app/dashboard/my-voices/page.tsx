'use client';

import { useState, useEffect } from 'react';
import { Member, MemberStatus, MemberStatusRecord, Category, MemberCategoryAssignment } from '@/types';
import { AuthUser } from '@/lib/auth';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { getCurrentUser } from '@/lib/auth';
import { getStatusLabel, getStatusColor, statusOrder } from '@/lib/status-utils';

interface VoiceMember extends Omit<Member, 'updatedAt'> {
  latestStatus?: MemberStatusRecord;
  category?: MemberCategoryAssignment;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string | Date;
}

type StatusFilter = 'all' | MemberStatus;
type CategoryFilter = 'all' | string;
type UserFilter = 'all' | string; // Changed from LeaderFilter to UserFilter to include both supervisor and leader

export default function MyVoicesPage() {
  const [members, setMembers] = useState<VoiceMember[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [userFilter, setUserFilter] = useState<UserFilter>('all'); // Changed from leaderFilter
  const [leaders, setLeaders] = useState<Array<{ id: string; code: string; display_name?: string; email: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatusRecord[]>>({});
  const [memberCategories, setMemberCategories] = useState<Record<string, MemberCategoryAssignment | null>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [showStatusDialog, setShowStatusDialog] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<Record<string, MemberStatus>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [savingCategory, setSavingCategory] = useState<Record<string, boolean>>({});

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    // Don't reload if data is already available
    if (expandedCardId) {
      // Only load if we don't have the data yet
      if (!memberStatuses[expandedCardId]) {
        loadMemberStatuses(expandedCardId);
      }
      if (!memberCategories[expandedCardId] && memberCategories[expandedCardId] !== null) {
        loadMemberCategory(expandedCardId);
      }
    }
  }, [expandedCardId]);

  useEffect(() => {
    if (showStatusDialog) {
      const member = members.find(m => m.id === showStatusDialog);
      if (member?.latestStatus) {
        setNewStatus(prev => ({ ...prev, [showStatusDialog]: member.latestStatus!.status }));
      } else if (memberStatuses[showStatusDialog]?.length > 0) {
        // Use already loaded status if available
        const latest = memberStatuses[showStatusDialog].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        setNewStatus(prev => ({ ...prev, [showStatusDialog]: latest.status }));
      }
      // Data should already be loaded from batch API
    }
  }, [showStatusDialog, members, memberStatuses]);

  useEffect(() => {
    if (showCategoryDialog) {
      // Set the current category as selected when dialog opens (data already loaded from batch)
      const currentCategory = memberCategories[showCategoryDialog];
      if (currentCategory) {
        setSelectedCategoryId(prev => ({ ...prev, [showCategoryDialog]: currentCategory.category_id }));
      }
      // Don't reload - data should already be available from batch API
    }
  }, [showCategoryDialog, memberCategories]);

  useEffect(() => {
    if (!currentUser) return;
    loadMyVoices();
  }, [statusFilter, categoryFilter, userFilter, currentUser]);

  // Reload leaders when currentUser changes to supervisor
  useEffect(() => {
    if (currentUser && currentUser.role === 'supervisor') {
      loadLeaders();
    }
  }, [currentUser]);

  const checkAuthAndLoadData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user && (user.role === 'supervisor' || user.role === 'team_leader')) {
      await loadCategories();
    }
    if (user && user.role === 'supervisor') {
      await loadLeaders(); // Load leaders
    }
    await loadMyVoices();
  };

  const loadLeaders = async () => {
    // Check currentUser from state
    if (!currentUser || currentUser.role !== 'supervisor') {
      return;
    }
    
    try {
      const response = await fetch('/api/users/leaders');
      if (!response.ok) {
        console.error('Leaders API error:', response.status, response.statusText);
        setLeaders([]);
        return;
      }
      const result = await response.json();
      console.log('Leaders API response:', result);
      if (result.success && result.leaders && Array.isArray(result.leaders)) {
        const leadersList = result.leaders.map((u: any) => ({
          id: u.id,
          code: u.code,
          display_name: u.display_name,
          email: u.email,
        }));
        console.log('Setting leaders:', leadersList);
        setLeaders(leadersList);
      } else if (result.leaders && Array.isArray(result.leaders)) {
        // Fallback if success field is not present
        const leadersList = result.leaders.map((u: any) => ({
          id: u.id,
          code: u.code,
          display_name: u.display_name,
          email: u.email,
        }));
        console.log('Setting leaders (fallback):', leadersList);
        setLeaders(leadersList);
      } else {
        console.log('No leaders found in response, setting empty array');
        setLeaders([]);
      }
    } catch (error) {
      console.error('Error loading leaders:', error);
      setLeaders([]);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.categories) {
        setCategories(result.categories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMyVoices = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const userParam = userFilter !== 'all' ? `&user=${encodeURIComponent(userFilter)}` : '';
      const response = await fetch(`/api/my-voices?status=${statusFilter}&category=${categoryFilter}${userParam}`);
      const data = await response.json();
      
      if (data.success) {
        let membersData = (data.members || []).map((member: any) => ({
          id: member.id,
          memberId: member.member_id,
          name: member.name,
          nameSearch: member.name_search,
          address: member.address || '',
          addressSearch: member.address_search || '',
          job: member.job || '',
          jobSearch: member.job_search || '',
          phone: member.phone || '',
          mobile: member.mobile || '',
          email: member.email || '',
          status: member.status || 'pending',
          notes: member.notes || '',
          teamId: member.team_id || '',
          teamName: member.team_name || '',
          createdAt: member.created_at ? new Date(member.created_at) : new Date(),
          latestStatus: member.latest_status ? {
            id: member.latest_status.id,
            member_id: member.latest_status.member_id,
            status: member.latest_status.status,
            supervisor_code: member.latest_status.supervisor_code,
            leader_code: member.latest_status.leader_code,
            updated_by: member.latest_status.updated_by,
            updated_by_name: member.latest_status.updated_by_name,
            updated_by_email: member.latest_status.updated_by_email,
            notes: member.latest_status.notes,
            created_at: member.latest_status.created_at,
            updated_at: member.latest_status.updated_at,
          } : undefined,
          category: member.category ? {
            id: member.category.id,
            member_id: member.category.member_id,
            category_id: member.category.category_id,
            category_name: member.category.category_name,
            assigned_by: member.category.assigned_by,
            assigned_at: member.category.assigned_at,
          } : undefined,
          updatedBy: member.updated_by,
          updatedByName: member.updated_by_name,
          updatedAt: member.updated_at,
        })) as VoiceMember[];

        // Apply client-side user filter to ensure correctness
        if (currentUser && userFilter !== 'all') {
          let selectedUserId: string | null = null;
          if (userFilter.startsWith('supervisor:')) {
            selectedUserId = currentUser.id;
          } else if (userFilter.startsWith('leader:')) {
            const code = userFilter.split(':')[1];
            const leader = leaders.find(l => l.code === code);
            selectedUserId = leader?.id || null;
          }
          if (selectedUserId) {
            membersData = membersData.filter(m => {
              const latestUpdater = m.latestStatus?.updated_by;
              const categoryAssigner = (m.category as any)?.assigned_by;
              const fallbackUpdater = m.updatedBy;
              return latestUpdater === selectedUserId || categoryAssigner === selectedUserId || fallbackUpdater === selectedUserId;
            });
          }
        }

        setMembers(membersData);
        
        // Load statuses and categories for all members
        if (currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader')) {
          loadAllMembersStatusesAndCategories(membersData);
        }
      }
    } catch (error) {
      console.error('Error loading my voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllMembersStatusesAndCategories = async (membersList: VoiceMember[]) => {
    if (membersList.length === 0) return;
    
    try {
      // Use batch API to fetch all statuses and categories at once
      const memberIds = membersList.map(m => m.id);
      const response = await fetch('/api/members/batch-status-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch batch data');
      }

      const result = await response.json();
      const batchData = result.data || {};

      // Update state with batch data
      const newMemberStatuses: Record<string, MemberStatusRecord[]> = {};
      const newMemberCategories: Record<string, MemberCategoryAssignment | null> = {};
      const updatedMembers = membersList.map(member => {
        const memberData = batchData[member.id];
        if (memberData) {
          if (memberData.statuses && memberData.statuses.length > 0) {
            newMemberStatuses[member.id] = memberData.statuses;
            if (memberData.latestStatus) {
              return { ...member, latestStatus: memberData.latestStatus };
            }
          }
          if (memberData.category) {
            newMemberCategories[member.id] = memberData.category;
          } else {
            newMemberCategories[member.id] = null;
          }
        }
        return member;
      });

      // Update all state at once
      setMemberStatuses(prev => ({ ...prev, ...newMemberStatuses }));
      setMemberCategories(prev => ({ ...prev, ...newMemberCategories }));
      setMembers(updatedMembers);
    } catch (error) {
      console.error('Error loading batch statuses and categories:', error);
    }
  };

  const loadMemberStatuses = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}/status`);
      const result = await response.json();
      if (result.statuses) {
        const sortedStatuses = result.statuses.sort((a: MemberStatusRecord, b: MemberStatusRecord) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setMemberStatuses(prev => ({ ...prev, [memberId]: sortedStatuses }));
        const latestStatus = sortedStatuses.length > 0 ? sortedStatuses[0] : null;
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, latestStatus } : m
        ));
        return latestStatus;
      }
      return null;
    } catch (error) {
      console.error('Error loading member statuses:', error);
      return null;
    }
  };

  const loadMemberCategory = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}/category`);
      const result = await response.json();
      if (result.assignment) {
        const assignment = result.assignment;
        const normalized = {
          ...assignment,
          category_name: assignment.category?.name || assignment.category_name,
        };
        setMemberCategories(prev => ({ ...prev, [memberId]: normalized }));
        setSelectedCategoryId(prev => ({ ...prev, [memberId]: normalized.category_id }));
      } else {
        setMemberCategories(prev => ({ ...prev, [memberId]: null }));
        setSelectedCategoryId(prev => ({ ...prev, [memberId]: '' }));
      }
    } catch (error) {
      console.error('Error loading member category:', error);
    }
  };

  const handleCreateStatus = async (memberId: string, status?: MemberStatus) => {
    if (savingStatus[memberId]) return;
    
    try {
      setSavingStatus(prev => ({ ...prev, [memberId]: true }));
      const statusToSave = status || newStatus[memberId] || 'chance';
      const response = await fetch(`/api/members/${memberId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: statusToSave,
          notes: statusNotes[memberId]?.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setSavingStatus(prev => ({ ...prev, [memberId]: false }));
        return;
      }

      setNewStatus(prev => ({ ...prev, [memberId]: statusToSave }));
      await loadMemberStatuses(memberId);
      if (result.status) {
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, latestStatus: result.status } : m
        ));
      }
      setSavingStatus(prev => ({ ...prev, [memberId]: false }));
      
      setTimeout(() => {
        setShowStatusDialog(prev => prev === memberId ? null : prev);
        setStatusNotes(prev => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
        setNewStatus(prev => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
      }, 100);
    } catch (error) {
      console.error('Error creating status:', error);
      setSavingStatus(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const handleAssignCategory = async (memberId: string, categoryId?: string) => {
    if (savingCategory[memberId]) return;
    
    const categoryToAssign = categoryId !== undefined ? categoryId : selectedCategoryId[memberId];
    
    try {
      setSavingCategory(prev => ({ ...prev, [memberId]: true }));
      
      if (!categoryToAssign) {
        const response = await fetch(`/api/members/${memberId}/category`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          setSavingCategory(prev => ({ ...prev, [memberId]: false }));
          return;
        }

        await loadMemberCategory(memberId);
      } else {
        const response = await fetch(`/api/members/${memberId}/category`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: categoryToAssign,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          setSavingCategory(prev => ({ ...prev, [memberId]: false }));
          return;
        }

        await loadMemberCategory(memberId);
      }
      
      setSavingCategory(prev => ({ ...prev, [memberId]: false }));
      
      setTimeout(() => {
        setShowCategoryDialog(prev => prev === memberId ? null : prev);
        setSelectedCategoryId(prev => {
          const newState = { ...prev };
          delete newState[memberId];
          return newState;
        });
      }, 100);
    } catch (error) {
      console.error('Error assigning category:', error);
      setSavingCategory(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const getLatestStatus = (member: VoiceMember): MemberStatusRecord | null => {
    if (member.latestStatus) return member.latestStatus;
    const statuses = memberStatuses[member.id];
    if (!statuses || statuses.length === 0) return null;
    return statuses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };



  // Filter members by status and category
  const filteredMembers = members.filter(member => {
    if (statusFilter !== 'all') {
      const latestStatus = getLatestStatus(member);
      if (!latestStatus || latestStatus.status !== statusFilter) {
        return false;
      }
    }
    
    if (categoryFilter !== 'all') {
      const category = memberCategories[member.id] || member.category;
      if (!category || category.category_id !== categoryFilter) {
        return false;
      }
    }
    
    return true;
  });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-blue-600">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8" dir="rtl">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">أصواتي</h1>
          <p className="text-gray-600">
            {currentUser.role === 'team_leader' && 'الأعضاء الذين قمت بتحديث حالتهم'}
            {currentUser.role === 'supervisor' && 'أعضاؤك وأعضاء القادة تحت إشرافك'}
            {currentUser.role === 'admin' && 'جميع الأعضاء مع تحديثات الحالة'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
          <div className={`grid grid-cols-1 ${currentUser?.role === 'supervisor' ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4 mb-4`}>
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تصفية حسب الحالة
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                dir="rtl"
              >
                <option value="all">الكل</option>
                {statusOrder.map(status => (
                  <option key={status} value={status}>
                    {getStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تصفية حسب التصنيف
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  dir="rtl"
                >
                  <option value="all">الكل</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* User Filter - Only for supervisors (filter by supervisor or leader) */}
            {currentUser?.role === 'supervisor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تصفية حسب المستخدم
                </label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value as UserFilter)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  dir="rtl"
                >
                  <option value="all">الكل</option>
                  <option value={`supervisor:${currentUser.code || ''}`}>
                    {currentUser.displayName || currentUser.email} - مشرف
                  </option>
                  {leaders && leaders.length > 0 && leaders.map(leader => (
                    <option key={leader.id} value={`leader:${leader.code}`}>
                      {leader.display_name || leader.email} - قائد
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="text-sm sm:text-base text-gray-600 pt-4 border-t border-gray-200">
            <span className="font-bold text-blue-600">{filteredMembers.length}</span>
            <span className="mr-1"> عضو</span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 text-base sm:text-lg font-medium">جاري التحميل...</p>
          </div>
        )}

        {/* Results - Same card layout as members page */}
        {!loading && (
          <>
            {filteredMembers.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 mb-4">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  لا توجد نتائج
                </h3>
                <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                  لا يوجد أعضاء يطابقون معايير البحث والتصفية
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {filteredMembers.map((member) => {
                  const isExpanded = expandedCardId === member.id;
                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden"
                    >
                      <div className="p-5 sm:p-6">
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div 
                              className="cursor-pointer mb-2"
                              onClick={() => setExpandedCardId(isExpanded ? null : member.id)}
                            >
                              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-blue-600 truncate">
                                {member.name}
                              </h3>
                            </div>
                            
                            {/* Status and Category */}
                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Status Icon */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader')) {
                                    const latestStatus = member.latestStatus;
                                    if (latestStatus) {
                                      setNewStatus(prev => ({ ...prev, [member.id]: latestStatus.status }));
                                    }
                                    setShowStatusDialog(member.id);
                                  }
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation relative z-10"
                                style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
                              >
                                {(() => {
                                  const latestStatus = getLatestStatus(member);
                                  const hasStatus = latestStatus !== null;
                                  return (
                                    <>
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-sm`} style={{ backgroundColor: hasStatus ? '#2563eb' : '#000000' }}>
                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                      </div>
                                      {latestStatus ? (
                                        <span className="text-xs text-gray-600 font-medium">
                                          {getStatusLabel(latestStatus.status)}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-gray-400">لا توجد حالة</span>
                                      )}
                                    </>
                                  );
                                })()}
                              </button>

                              {/* Category Icon - Team leaders always; supervisors can edit their own or unassigned */}
                              {currentUser && (() => {
                                const role = currentUser.role;
                                const assignment = memberCategories[member.id] || member.category;
                                const isLeader = role === 'team_leader';
                                const isSupervisor = role === 'supervisor';
                                const isSupervisorOwn = isSupervisor && assignment && assignment.assigned_by === currentUser.id;
                                const canShow = isLeader || isSupervisorOwn || (isSupervisor && !assignment);
                                if (!canShow) return null;
                                return (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowCategoryDialog(member.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation relative z-10"
                                    style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
                                  >
                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-sm`} style={{ backgroundColor: assignment ? '#2563eb' : '#000000' }}>
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                    </div>
                                    {assignment?.category_name ? (
                                      <span className="text-xs text-gray-600 font-medium">
                                        {assignment.category_name}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-gray-400">لا يوجد تصنيف</span>
                                    )}
                                  </button>
                                );
                              })()}

                              {/* Updated By Info */}
                              {member.updatedByName && (
                                <span className="text-xs text-gray-500">
                                  محدث بواسطة: {member.updatedByName}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedCardId(isExpanded ? null : member.id);
                            }}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative z-10"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <svg
                              className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="px-5 sm:px-6 pb-5 sm:pb-6 border-t border-gray-100 pt-4 mt-4">
                          <div className="space-y-2 text-xs sm:text-sm text-gray-600">
                            {member.memberId && <div>رقم العضو: {member.memberId}</div>}
                            {member.job && <div>{member.job}</div>}
                            {member.address && <div>{member.address}</div>}
                            {member.mobile && (
                              <div>
                                <a href={`tel:${member.mobile}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                                  {member.mobile}
                                </a>
                              </div>
                            )}
                            {member.phone && (
                              <div>
                                <a href={`tel:${member.phone}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                                  {member.phone}
                                </a>
                              </div>
                            )}
                            {member.email && (
                              <div>
                                <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-700 hover:underline break-all">
                                  {member.email}
                                </a>
                              </div>
                            )}
                            {member.updatedAt && (
                              <div className="text-gray-500">
                                آخر تحديث: {new Date(member.updatedAt).toLocaleDateString('ar-EG')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Status Dialog - Same as members page */}
        {showStatusDialog && currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sticky top-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {(() => {
                      const member = members.find(m => m.id === showStatusDialog);
                      return member ? `إدارة حالة: ${member.name}` : 'إدارة الحالة';
                    })()}
                  </h2>
                  <button
                    onClick={() => {
                      setShowStatusDialog(null);
                      setStatusNotes(prev => ({ ...prev, [showStatusDialog]: '' }));
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">إضافة حالة جديدة</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        اختر الحالة <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {statusOrder.map(status => {
                          const isSelected = newStatus[showStatusDialog] === status;
                          const member = members.find(m => m.id === showStatusDialog);
                          const latestStatusFromMember = member?.latestStatus;
                          const latestStatusFromArray = memberStatuses[showStatusDialog] && memberStatuses[showStatusDialog].length > 0
                            ? memberStatuses[showStatusDialog][0]
                            : null;
                          const latestStatus = latestStatusFromMember || latestStatusFromArray;
                          const isCurrentStatus = latestStatus?.status === status;
                          const isSaving = savingStatus[showStatusDialog] && isSelected;
                          const shouldHighlight = isSelected || isCurrentStatus;
                          
                          return (
                            <button
                              key={status}
                              type="button"
                              disabled={isSaving}
                              onClick={async () => {
                                setNewStatus(prev => ({ ...prev, [showStatusDialog]: status }));
                                await handleCreateStatus(showStatusDialog, status);
                              }}
                              className={`px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold ${
                                shouldHighlight
                                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                              style={shouldHighlight ? {
                                borderColor: '#2563eb',
                                backgroundColor: '#eff6ff',
                                color: '#1e40af'
                              } : {}}
                            >
                              {isSaving ? 'جاري الحفظ...' : getStatusLabel(status)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowStatusDialog(null);
                      setStatusNotes(prev => {
                        const newState = { ...prev };
                        delete newState[showStatusDialog || ''];
                        return newState;
                      });
                      setNewStatus(prev => {
                        const newState = { ...prev };
                        delete newState[showStatusDialog || ''];
                        return newState;
                      });
                    }}
                    fullWidth={true}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Dialog - Team leaders and supervisors */}
        {showCategoryDialog && currentUser && (currentUser.role === 'team_leader' || currentUser.role === 'supervisor') && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 sticky top-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {(() => {
                      const member = members.find(m => m.id === showCategoryDialog);
                      return member ? `تصنيف: ${member.name}` : 'التصنيف';
                    })()}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCategoryDialog(null);
                    }}
                    className="text-white hover:text-gray-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    اختر التصنيف
                  </label>
                  <div className="space-y-2">
                    {memberCategories[showCategoryDialog] && (
                      <button
                        type="button"
                        onClick={async () => {
                          setSelectedCategoryId(prev => ({ ...prev, [showCategoryDialog]: '' }));
                          await handleAssignCategory(showCategoryDialog, '');
                        }}
                        disabled={savingCategory[showCategoryDialog]}
                        className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold text-right ${
                          !selectedCategoryId[showCategoryDialog] && memberCategories[showCategoryDialog]
                            ? 'border-red-600 bg-red-50 text-red-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50'
                        } ${savingCategory[showCategoryDialog] ? 'opacity-50 cursor-wait' : ''}`}
                        style={!selectedCategoryId[showCategoryDialog] && memberCategories[showCategoryDialog] ? {
                          borderColor: '#dc2626',
                          backgroundColor: '#fef2f2',
                          color: '#991b1b'
                        } : {}}
                      >
                        {savingCategory[showCategoryDialog] && !selectedCategoryId[showCategoryDialog] ? 'جاري الحفظ...' : 'إزالة التصنيف'}
                      </button>
                    )}
                    
                    {categories.map(cat => {
                      const isSelected = selectedCategoryId[showCategoryDialog] === cat.id;
                      const isCurrentCategory = memberCategories[showCategoryDialog]?.category_id === cat.id;
                      const shouldHighlight = isSelected || isCurrentCategory;
                      const isSaving = savingCategory[showCategoryDialog] && isSelected;
                      
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={async () => {
                            setSelectedCategoryId(prev => ({ ...prev, [showCategoryDialog]: cat.id }));
                            await handleAssignCategory(showCategoryDialog, cat.id);
                          }}
                          disabled={isSaving}
                          className={`w-full px-4 py-3 rounded-lg border-2 transition-all text-sm font-semibold text-right ${
                            shouldHighlight
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                          } ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                          style={shouldHighlight ? {
                            borderColor: '#2563eb',
                            backgroundColor: '#eff6ff',
                            color: '#1e40af'
                          } : {}}
                        >
                          {isSaving ? 'جاري الحفظ...' : cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setShowCategoryDialog(null);
                      setSelectedCategoryId(prev => {
                        const newState = { ...prev };
                        delete newState[showCategoryDialog || ''];
                        return newState;
                      });
                    }}
                    fullWidth={true}
                  >
                    إغلاق
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


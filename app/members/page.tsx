'use client';

import { useState, useEffect } from 'react';
import { Member, MemberStatus, MemberStatusRecord, Category, MemberCategoryAssignment } from '@/types';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { getStatusLabel, getStatusColor, statusOrder } from '@/lib/status-utils';

interface SearchResult extends Member {
  rank?: number;
  match_type?: string;
  latestStatus?: MemberStatusRecord;
  category?: MemberCategoryAssignment;
}

type SearchColumn = 'all' | 'name' | 'address' | 'job' | 'mobile' | 'phone' | 'member_id';

export default function MembersSearchPage() {
  const [members, setMembers] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchColumn, setSearchColumn] = useState<SearchColumn>('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [memberStatuses, setMemberStatuses] = useState<Record<string, MemberStatusRecord[]>>({});
  const [memberCategories, setMemberCategories] = useState<Record<string, MemberCategoryAssignment | null>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [showStatusForm, setShowStatusForm] = useState<Record<string, boolean>>({});
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newStatus, setNewStatus] = useState<Record<string, MemberStatus>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<Record<string, string>>({});
  const [showStatusDialog, setShowStatusDialog] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState<string | null>(null);
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
      // Set the latest status immediately from member object (already loaded)
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
      // Only reload if we don't have fresh data (avoid unnecessary API calls)
      // Data should already be loaded from batch API
    } else {
      // Clear status when dialog closes
      setNewStatus(prev => {
        const newState = { ...prev };
        delete newState[showStatusDialog || ''];
        return newState;
      });
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
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim(), searchColumn);
      } else if (searchQuery.trim().length === 0 && hasSearched) {
        loadInitialMembers();
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchColumn]);

  const loadInitialMembers = async (user?: any) => {
    try {
      setLoading(true);
      const response = await fetch('/api/members?limit=50');
      const data = await response.json();
      
      if (data.success) {
        const membersData = data.members.map((member: any) => ({
          id: member.id,
          memberId: member.member_id,
          name: member.name,
          nameSearch: member.name_search,
          address: member.address,
          addressSearch: member.address_search,
          job: member.job,
          jobSearch: member.job_search,
          phone: member.phone,
          mobile: member.mobile,
          email: member.email,
          status: member.status,
          notes: member.notes,
          teamId: member.team_id,
          teamName: member.team_name,
          createdAt: member.created_at ? new Date(member.created_at) : new Date(),
          updatedAt: member.updated_at ? new Date(member.updated_at) : new Date(),
        })) as Member[];
        setMembers(membersData);
        setTotalCount(membersData.length);
        
        // Load statuses and categories for all members if user is supervisor or leader
        const userToCheck = user || currentUser;
        if (userToCheck && (userToCheck.role === 'supervisor' || userToCheck.role === 'team_leader')) {
          loadAllMembersStatusesAndCategories(membersData);
        }
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string, column: SearchColumn) => {
    try {
      setLoading(true);
      setHasSearched(true);
      
      const response = await fetch(`/api/members?q=${encodeURIComponent(query)}&column=${column}&limit=1000`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch members');
      }
      
      const searchResults = (data.members || []).map((member: any) => ({
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
        updatedAt: member.updated_at ? new Date(member.updated_at) : new Date(),
        rank: member.rank || 0,
        match_type: member.match_type || 'partial',
      })) as SearchResult[];

      setMembers(searchResults);
      setTotalCount(searchResults.length);
      
      // Load statuses and categories for all members
      if (currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader')) {
        loadAllMembersStatusesAndCategories(searchResults);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setMembers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const getMatchTypeText = (matchType?: string) => {
    switch (matchType) {
      case 'exact_name':
        return 'تطابق تام';
      case 'prefix_name':
        return 'يبدأ بالاسم';
      case 'first_name_prefix':
        return 'الاسم الأول';
      case 'name_contains':
        return 'يحتوي على';
      case 'address_match':
        return 'عنوان';
      case 'job_match':
        return 'وظيفة';
      default:
        return 'مطابقة';
    }
  };

  const getMatchTypeColor = (matchType?: string) => {
    switch (matchType) {
      case 'exact_name':
        return 'bg-emerald-500 text-white';
      case 'prefix_name':
        return 'bg-blue-500 text-white';
      case 'first_name_prefix':
        return 'bg-cyan-500 text-white';
      case 'name_contains':
        return 'bg-teal-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const checkAuthAndLoadData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user && (user.role === 'supervisor' || user.role === 'team_leader')) {
      await loadCategories();
    }
    await loadInitialMembers(user);
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

  const loadMemberStatuses = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}/status`);
      const result = await response.json();
      if (result.statuses) {
        // Sort by date descending (latest first)
        const sortedStatuses = result.statuses.sort((a: MemberStatusRecord, b: MemberStatusRecord) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setMemberStatuses(prev => ({ ...prev, [memberId]: sortedStatuses }));
        // Update member's latest status
        const latestStatus = sortedStatuses.length > 0 ? sortedStatuses[0] : null;
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, latestStatus } : m
        ));
        // Return latest status for highlighting
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
        setMemberCategories(prev => ({ ...prev, [memberId]: result.assignment }));
        setSelectedCategoryId(prev => ({ ...prev, [memberId]: result.assignment.category_id }));
      } else {
        setMemberCategories(prev => ({ ...prev, [memberId]: null }));
        setSelectedCategoryId(prev => ({ ...prev, [memberId]: '' }));
      }
    } catch (error) {
      console.error('Error loading member category:', error);
    }
  };

  const loadAllMembersStatusesAndCategories = async (membersList: SearchResult[]) => {
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

  const handleCreateStatus = async (memberId: string, status?: MemberStatus) => {
    if (savingStatus[memberId]) return; // Prevent double-clicks
    
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

      setShowStatusForm(prev => ({ ...prev, [memberId]: false }));
      // Update the selected status in state immediately for visual feedback
      setNewStatus(prev => ({ ...prev, [memberId]: statusToSave }));
      // Reload statuses to get the latest
      await loadMemberStatuses(memberId);
      // Update member's latest status immediately
      if (result.status) {
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, latestStatus: result.status } : m
        ));
      }
      setSavingStatus(prev => ({ ...prev, [memberId]: false }));
      
      // Close the dialog after successful save (if it's open for this member)
      // Use setTimeout to ensure state updates are processed
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

  const handleDeleteStatus = async (memberId: string, statusId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}/status?statusId=${statusId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        return;
      }

      await loadMemberStatuses(memberId);
      // Refresh member list to update status icon
      const member = members.find(m => m.id === memberId);
      if (member) {
        const latestStatus = memberStatuses[memberId]?.length > 0 
          ? memberStatuses[memberId].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
          : undefined;
        setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, latestStatus } : m
        ));
      }
    } catch (error) {
      console.error('Error deleting status:', error);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDescription.trim() || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return;
      }

      setShowCategoryForm(false);
      setNewCategoryName('');
      setNewCategoryDescription('');
      await loadCategories();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleAssignCategory = async (memberId: string, categoryId?: string) => {
    if (savingCategory[memberId]) return; // Prevent double-clicks
    
    const categoryToAssign = categoryId !== undefined ? categoryId : selectedCategoryId[memberId];
    
    try {
      setSavingCategory(prev => ({ ...prev, [memberId]: true }));
      
      if (!categoryToAssign) {
        // Remove category assignment
        const response = await fetch(`/api/members/${memberId}/category`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          setSavingCategory(prev => ({ ...prev, [memberId]: false }));
          return;
        }

        await loadMemberCategory(memberId);
      } else {
        // Assign category
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
      
      // Close the dialog after successful save
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

  const getStatusColorClass = (status: string | MemberStatus) => {
    if (status === 'chance' || status === 'called' || status === 'will_vote' || status === 'sure_vote' || status === 'voted') {
      return getStatusColor(status as MemberStatus);
    }
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'inactive':
        return 'bg-red-500 text-white';
      default:
        return 'bg-yellow-500 text-white';
    }
  };

  const getStatusText = (status: string | MemberStatus) => {
    if (status === 'chance' || status === 'called' || status === 'will_vote' || status === 'sure_vote' || status === 'voted') {
      return getStatusLabel(status as MemberStatus);
    }
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      default:
        return 'قيد الانتظار';
    }
  };

  const getLatestStatus = (member: SearchResult): MemberStatusRecord | null => {
    if (member.latestStatus) return member.latestStatus;
    const statuses = memberStatuses[member.id];
    if (!statuses || statuses.length === 0) return null;
    return statuses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const getStatusForIcon = (member: SearchResult): MemberStatus | 'pending' => {
    const latestStatus = getLatestStatus(member);
    if (latestStatus) return latestStatus.status;
    // Default to 'chance' if no status exists but user can manage
    if (currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader')) {
      return 'chance';
    }
    return 'pending';
  };

  const getColumnLabel = (column: SearchColumn) => {
    switch (column) {
      case 'all':
        return 'الكل';
      case 'name':
        return 'الاسم';
      case 'address':
        return 'العنوان';
      case 'job':
        return 'الوظيفة';
      case 'mobile':
        return 'الجوال';
      case 'phone':
        return 'الهاتف';
      case 'member_id':
        return 'رقم العضو';
      default:
        return 'الكل';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100" dir="rtl">
      <Navigation />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Create Category Button - Only for supervisors/leaders */}
        {currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader') && (
          <div className="mb-4 flex justify-end">
            <Button
              onClick={() => setShowCategoryForm(!showCategoryForm)}
              size="sm"
            >
              {showCategoryForm ? 'إلغاء' : 'إضافة فئة جديدة'}
            </Button>
          </div>
        )}

        {/* Create Category Form */}
        {showCategoryForm && currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader') && (
          <div className="mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-bold text-white">إضافة فئة جديدة</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفئة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="مثال: داعمون قويون"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="وصف الفئة..."
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={handleCreateCategory} fullWidth={true}>
                  إنشاء فئة
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowCategoryForm(false);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                  }}
                  fullWidth={true}
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Professional Search Card */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
          {/* Column Selection - Dropdown Menu */}
          <div className="mb-4 sm:mb-6">
            <label htmlFor="search-column" className="block text-sm sm:text-base font-bold text-gray-800 mb-2">
              <span className="hidden sm:inline">اختر عمود البحث:</span>
              <span className="sm:hidden">عمود البحث:</span>
            </label>
            <div className="relative">
              <select
                id="search-column"
                value={searchColumn}
                onChange={(e) => setSearchColumn(e.target.value as SearchColumn)}
                className="w-full sm:w-auto min-w-[200px] pr-10 pl-4 py-3 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all bg-white appearance-none cursor-pointer font-medium text-gray-800 hover:border-gray-400"
                dir="rtl"
              >
                {(['all', 'name', 'address', 'job', 'mobile', 'phone', 'member_id'] as SearchColumn[]).map((col) => (
                  <option key={col} value={col}>
                    {getColumnLabel(col)}
                  </option>
                ))}
              </select>
              {/* Custom dropdown arrow */}
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search Input - Professional Design */}
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`ابحث في ${getColumnLabel(searchColumn).toLowerCase()}...`}
              className="w-full pr-12 sm:pr-14 pl-4 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
              dir="rtl"
              autoFocus
            />
          </div>
          
          {/* Search Stats */}
          {searchQuery && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t border-gray-200">
              <div className="text-sm sm:text-base text-gray-700">
                <span className="font-bold text-blue-600">{totalCount}</span>
                <span className="mr-1"> عضو</span>
                {searchQuery.length < 2 && (
                  <span className="text-amber-600 text-xs sm:text-sm mr-2">(اكتب حرفين على الأقل)</span>
                )}
              </div>
              {members.length > 0 && members[0].match_type && (
                <div className="text-xs sm:text-sm">
                  <span className="text-gray-500">أفضل نتيجة: </span>
                  <span className={`px-2 py-1 rounded-lg font-medium ${getMatchTypeColor(members[0].match_type)}`}>
                    {getMatchTypeText(members[0].match_type)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Loading State - Professional */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 text-base sm:text-lg font-medium">جاري البحث...</p>
          </div>
        )}

        {/* Results - Professional Cards */}
        {!loading && (
          <>
            {members.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center border border-gray-100">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 mb-4">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
                  {hasSearched ? 'لا توجد نتائج' : 'ابدأ البحث'}
                </h3>
                <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
                  {hasSearched 
                    ? 'لم نجد أي أعضاء يطابقون بحثك. جرب كلمات مختلفة أو اختر عمود آخر.'
                    : 'اكتب في حقل البحث للعثور على الأعضاء'}
                </p>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {members.map((member) => {
                  const isExpanded = expandedCardId === member.id;
                  return (
                    <div
                      key={member.id}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 overflow-hidden"
                    >
                      {/* Collapsed Header - Always Visible */}
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
                            
                            {/* Status and Category - Below Name */}
                            <div className="flex items-center gap-3 flex-wrap">
                              {/* Status Icon with Text */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader')) {
                                    // Set the latest status immediately when opening dialog
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
                                aria-label="تغيير الحالة"
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
                              
                              {/* Category Icon with Text - Visible for supervisors and team leaders, clickable for both */}
                              {currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader') && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowCategoryDialog(member.id);
                                  }}
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onTouchStart={(e) => e.stopPropagation()}
                                  className="flex items-center gap-1.5 flex-shrink-0 px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation relative z-10"
                                  aria-label="عرض التصنيف"
                                  style={{ WebkitTapHighlightColor: 'transparent', pointerEvents: 'auto' }}
                                >
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-sm`} style={{ backgroundColor: memberCategories[member.id] ? '#2563eb' : '#000000' }}>
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                  {memberCategories[member.id]?.category_name ? (
                                    <span className="text-xs text-gray-600 font-medium">
                                      {memberCategories[member.id]!.category_name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">لا يوجد تصنيف</span>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expand/Collapse Icon */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setExpandedCardId(isExpanded ? null : member.id);
                            }}
                            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors relative z-10"
                            aria-label={isExpanded ? 'Collapse' : 'Expand'}
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

                      {/* Expanded Content - Shown when expanded */}
                      {isExpanded && (
                        <div className="px-5 sm:px-6 lg:px-8 pb-5 sm:pb-6 lg:pb-8 border-t border-gray-200 animate-in slide-in-from-top duration-200">
                          {/* Additional Header Info - Shown when expanded */}
                          <div className="flex items-center gap-3 mb-6 pt-6 flex-wrap">
                            {member.memberId && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700">
                                #{member.memberId}
                              </span>
                            )}
                            {member.match_type && (
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${getMatchTypeColor(member.match_type)}`}>
                                {getMatchTypeText(member.match_type)}
                              </span>
                            )}
                          </div>

                          {/* Expanded Information Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {/* Job Section */}
                            {member.job && (
                              <div className="text-xs sm:text-sm text-gray-700 break-words">
                                {member.job}
                              </div>
                            )}

                            {/* Address Section */}
                            {member.address && (
                              <div className="text-xs sm:text-sm text-gray-700 break-words">
                                {member.address}
                              </div>
                            )}

                            {/* Mobile Section */}
                            {member.mobile && (
                              <div className="text-xs sm:text-sm">
                                <a href={`tel:${member.mobile}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                                  {member.mobile}
                                </a>
                              </div>
                            )}

                            {/* Phone Section */}
                            {member.phone && (
                              <div className="text-xs sm:text-sm">
                                <a href={`tel:${member.phone}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                                  {member.phone}
                                </a>
                              </div>
                            )}

                            {/* Team Section */}
                            {member.teamName && (
                              <div className="text-xs sm:text-sm text-gray-700">
                                {member.teamName}
                              </div>
                            )}

                            {/* Email Section */}
                            {member.email && (
                              <div className="text-xs sm:text-sm">
                                <a href={`mailto:${member.email}`} className="text-blue-600 hover:text-blue-700 hover:underline break-all">
                                  {member.email}
                                </a>
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

        {/* Status Dialog - Mobile */}
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
                {/* Add New Status Form */}
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
                          // Get the latest status from member object first (already loaded), then from statuses array
                          const member = members.find(m => m.id === showStatusDialog);
                          const latestStatusFromMember = member?.latestStatus;
                          const latestStatusFromArray = memberStatuses[showStatusDialog] && memberStatuses[showStatusDialog].length > 0
                            ? memberStatuses[showStatusDialog][0]
                            : null;
                          const latestStatus = latestStatusFromMember || latestStatusFromArray;
                          const isCurrentStatus = latestStatus?.status === status;
                          
                          const isSaving = savingStatus[showStatusDialog] && isSelected;
                          // Highlight if selected OR if it's the current/latest status
                          const shouldHighlight = isSelected || isCurrentStatus;
                          
                          // Debug: Log to see what's happening
                          if (status === statusOrder[0] && showStatusDialog) {
                            console.log('Status dialog debug:', {
                              status,
                              isSelected,
                              isCurrentStatus,
                              shouldHighlight,
                              newStatusValue: newStatus[showStatusDialog],
                              latestStatusFromMember: latestStatusFromMember?.status,
                              latestStatusFromArray: latestStatusFromArray?.status,
                            });
                          }
                          
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ملاحظات (اختياري - يمكن إضافتها بعد اختيار الحالة)
                      </label>
                      <textarea
                        value={statusNotes[showStatusDialog] || ''}
                        onChange={(e) => setStatusNotes(prev => ({ ...prev, [showStatusDialog]: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="أضف ملاحظات حول هذه الحالة..."
                      />
                      {statusNotes[showStatusDialog] && statusNotes[showStatusDialog].trim() && (
                        <Button
                          onClick={async () => {
                            // Update the last status with notes
                            const latestStatus = memberStatuses[showStatusDialog]?.[0];
                            if (latestStatus) {
                              await handleCreateStatus(showStatusDialog, latestStatus.status);
                            }
                          }}
                          className="mt-2"
                          size="sm"
                        >
                          حفظ الملاحظات
                        </Button>
                      )}
                    </div>
                    <div className="flex gap-3">
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
            </div>
          </div>
        )}

        {/* Category Dialog - Mobile */}
        {showCategoryDialog && currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader') && (
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
                    {/* Remove Category Button */}
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
                    
                    {/* Category Buttons */}
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

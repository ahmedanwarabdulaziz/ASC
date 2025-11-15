'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Member, MemberStatus, MemberStatusRecord, Category, MemberCategoryAssignment, Team } from '@/types';
import Navigation from '@/components/Navigation';
import Button from '@/components/Button';
import { getCurrentUser, AuthUser } from '@/lib/auth';
import { getStatusLabel, getStatusColor, statusOrder } from '@/lib/status-utils';
import { supabaseAdmin } from '@/lib/supabase';

interface SearchResult extends Member {
  rank?: number;
  match_type?: string;
  latestStatus?: MemberStatusRecord;
  category?: MemberCategoryAssignment;
}

type SearchColumn = 'all' | 'name' | 'address' | 'job' | 'mobile' | 'phone' | 'member_id';

export default function TeamMembersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.id as string;
  
  const [team, setTeam] = useState<Team | null>(null);
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
  const [newStatus, setNewStatus] = useState<Record<string, MemberStatus>>({});
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<Record<string, string>>({});
  const [showStatusDialog, setShowStatusDialog] = useState<string | null>(null);
  const [showCategoryDialog, setShowCategoryDialog] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [savingCategory, setSavingCategory] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTeam();
    checkAuthAndLoadData();
  }, [teamId]);

  useEffect(() => {
    if (team && currentUser) {
      loadTeamMembers();
    }
  }, [team, currentUser]);

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
    const timer = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch(searchQuery.trim(), searchColumn);
      } else if (searchQuery.trim().length === 0 && hasSearched) {
        loadTeamMembers();
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchColumn]);

  const loadTeam = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (error) throw error;
      if (data) {
        setTeam({
          id: data.id,
          name: data.name,
          nameSearch: data.name_search || '',
          candidateId: data.candidate_id || '',
          candidateName: data.candidate_name || '',
          members: data.members || [],
          createdAt: new Date(data.created_at),
        } as Team);
      }
    } catch (error) {
      console.error('Error loading team:', error);
    }
  };

  const checkAuthAndLoadData = async () => {
    const user = await getCurrentUser();
    setCurrentUser(user);
    if (user && (user.role === 'supervisor' || user.role === 'team_leader')) {
      await loadCategories();
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

  const loadTeamMembers = async () => {
    if (!team || !currentUser) return;
    
    try {
      setLoading(true);
      // Get team members from Supabase
      const { data: teamData, error: teamError } = await supabaseAdmin
        .from('teams')
        .select('members')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData || !teamData.members || teamData.members.length === 0) {
        setMembers([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let memberIdsToShow = teamData.members;

      // For leaders: Only show members where they updated the status
      if (currentUser.role === 'team_leader') {
        const { data: statuses } = await supabaseAdmin
          .from('member_statuses')
          .select('member_id')
          .eq('updated_by', currentUser.id)
          .in('member_id', teamData.members);

        memberIdsToShow = Array.from(new Set((statuses || []).map(s => s.member_id)));
      }

      if (memberIdsToShow.length === 0) {
        setMembers([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Fetch members by their IDs
      const { data: membersData, error: membersError } = await supabaseAdmin
        .from('members')
        .select('*')
        .in('id', memberIdsToShow);

      if (membersError) throw membersError;

      const formattedMembers = (membersData || []).map((member: any) => ({
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
      })) as SearchResult[];

      setMembers(formattedMembers);
      setTotalCount(formattedMembers.length);

      // Load statuses and categories for all members
      if (currentUser && (currentUser.role === 'supervisor' || currentUser.role === 'team_leader')) {
        loadAllMembersStatusesAndCategories(formattedMembers);
      }
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string, column: SearchColumn) => {
    if (!team || !currentUser) return;
    
    try {
      setLoading(true);
      setHasSearched(true);
      
      // First get team member IDs
      const { data: teamData } = await supabaseAdmin
        .from('teams')
        .select('members')
        .eq('id', teamId)
        .single();

      if (!teamData || !teamData.members || teamData.members.length === 0) {
        setMembers([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      let teamMemberIds = teamData.members;

      // For leaders: Only search in members where they updated the status
      if (currentUser.role === 'team_leader') {
        const { data: statuses } = await supabaseAdmin
          .from('member_statuses')
          .select('member_id')
          .eq('updated_by', currentUser.id)
          .in('member_id', teamData.members);

        teamMemberIds = Array.from(new Set((statuses || []).map(s => s.member_id)));
      }

      if (teamMemberIds.length === 0) {
        setMembers([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      // Search with team filter
      const response = await fetch(`/api/members?q=${encodeURIComponent(query)}&column=${column}&limit=1000&teamId=${teamId}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch members');
      }
      
      let searchResults = (data.members || []).map((member: any) => ({
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

      // For leaders: Filter to only members they updated
      if (currentUser.role === 'team_leader') {
        searchResults = searchResults.filter(m => teamMemberIds.includes(m.id));
      }

      setMembers(searchResults);
      setTotalCount(searchResults.length);
      
      // Load statuses and categories for search results
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

  const getLatestStatus = (member: SearchResult): MemberStatusRecord | null => {
    if (member.latestStatus) return member.latestStatus;
    const statuses = memberStatuses[member.id];
    if (!statuses || statuses.length === 0) return null;
    return statuses.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const getColumnLabel = (column: SearchColumn): string => {
    const labels: Record<SearchColumn, string> = {
      all: 'الكل',
      name: 'الاسم',
      address: 'العنوان',
      job: 'الوظيفة',
      mobile: 'الجوال',
      phone: 'الهاتف',
      member_id: 'رقم العضو',
    };
    return labels[column];
  };

  if (!team) {
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
        {/* Team Info Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2">{team.name}</h1>
              <p className="text-gray-600">المرشح: {team.candidateName}</p>
              <p className="text-sm text-gray-500 mt-1">عدد الأعضاء: {members.length}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/dashboard/teams')}
            >
              العودة إلى الفرق
            </Button>
          </div>
        </div>

        {/* Search Section - Same as members page */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-6 border border-gray-100">
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
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

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
          
          {searchQuery && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-4 border-t border-gray-200">
              <div className="text-sm sm:text-base text-gray-700">
                <span className="font-bold text-blue-600">{totalCount}</span>
                <span className="mr-1"> عضو</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600 text-base sm:text-lg font-medium">جاري البحث...</p>
          </div>
        )}

        {/* Results - Same card layout as members page */}
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
                  {hasSearched ? 'لا توجد نتائج' : 'لا يوجد أعضاء في هذا الفريق'}
                </h3>
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

                              {/* Category Icon - Only for team leaders */}
                              {currentUser && currentUser.role === 'team_leader' && (
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
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center shadow-sm`} style={{ backgroundColor: memberCategories[member.id] ? '#2563eb' : '#000000' }}>
                                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                  </div>
                                  {memberCategories[member.id] && memberCategories[member.id]?.category_name ? (
                                    <span className="text-xs text-gray-600 font-medium">
                                      {memberCategories[member.id]?.category_name}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">لا يوجد تصنيف</span>
                                  )}
                                </button>
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
              </div>
            </div>
          </div>
        )}

        {/* Category Dialog - Only for team leaders */}
        {showCategoryDialog && currentUser && currentUser.role === 'team_leader' && (
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

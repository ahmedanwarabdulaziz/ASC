'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Team } from '@/types';
import Link from 'next/link';
import Button from '@/components/Button';

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const teamsRef = collection(db, 'teams');
      const q = query(teamsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      const teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
      })) as Team[];

      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !candidateName.trim()) {
      alert('يرجى إدخال اسم الفريق واسم المرشح');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTeamName,
          candidateId: `candidate-${Date.now()}`,
          candidateName: candidateName,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message);
        setNewTeamName('');
        setCandidateName('');
        setShowCreateForm(false);
        loadTeams();
      } else {
        alert('خطأ: ' + result.error);
      }
    } catch (error) {
      alert('حدث خطأ أثناء إنشاء الفريق');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-blue">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue text-white py-4 shadow-md">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">إدارة الفرق</h1>
            <Link 
              href="/dashboard"
              className="text-white hover:text-gray-200"
            >
              العودة إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Create Team Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            {showCreateForm ? 'إلغاء' : 'إنشاء فريق جديد'}
          </Button>
        </div>

        {/* Create Team Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-blue mb-4">إنشاء فريق جديد</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم الفريق
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="أدخل اسم الفريق"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  اسم المرشح
                </label>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="أدخل اسم المرشح"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue focus:border-transparent"
                />
              </div>
              <Button
                onClick={handleCreateTeam}
                loading={creating}
              >
                إنشاء الفريق
              </Button>
            </div>
          </div>
        )}

        {/* Teams List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-blue">
              الفرق ({teams.length})
            </h2>
          </div>

          {teams.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              لا توجد فرق
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-semibold text-blue mb-2">
                    {team.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    المرشح: {team.candidateName}
                  </p>
                  <p className="text-sm text-gray-500">
                    عدد الأعضاء: {team.members?.length || 0}
                  </p>
                  <Link
                    href={`/dashboard/teams/${team.id}`}
                    className="mt-4 inline-block text-blue hover:text-blue-700 text-sm font-medium"
                  >
                    عرض التفاصيل →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


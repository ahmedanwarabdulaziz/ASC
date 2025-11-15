import { MemberStatus } from '@/types';

export const statusLabels: Record<MemberStatus, string> = {
  chance: 'فرصة',
  called: 'تم الاتصال',
  will_vote: 'سيصوت',
  sure_vote: 'صوت مؤكد',
  voted: 'صوت',
};

export const statusColors: Record<MemberStatus, string> = {
  chance: 'bg-yellow-100 text-yellow-800',
  called: 'bg-blue-100 text-blue-800',
  will_vote: 'bg-purple-100 text-purple-800',
  sure_vote: 'bg-green-100 text-green-800',
  voted: 'bg-emerald-100 text-emerald-800',
};

export function getStatusLabel(status: MemberStatus): string {
  return statusLabels[status] || status;
}

export function getStatusColor(status: MemberStatus): string {
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}

export const statusOrder: MemberStatus[] = ['chance', 'called', 'will_vote', 'sure_vote', 'voted'];



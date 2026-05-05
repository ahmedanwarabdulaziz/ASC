'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addMedicalApprovalFromDashboard } from '@/server/actions/sports/medical-approvals';
import styles from './medical-approvals.module.css';

type SectorType = 'practice' | 'competition';
type ApprovalState = 'not_required' | 'missing' | 'valid' | 'expiring_soon' | 'expired' | 'revoked';

type ApprovalRecord = {
  id: string;
  sector_type: SectorType;
  status: 'valid' | 'expired' | 'revoked';
  issue_date: string;
  validity_months: number;
  expiry_date: string;
  notes: string | null;
};

type DashboardRow = {
  id: string;
  person_id: string;
  sport_id: string;
  sport_name: string;
  player_status: string;
  level_name: string | null;
  full_name: string;
  national_id: string | null;
  practice_sector: { id: string; sector_type: SectorType; name: string; requires_medical_approval: boolean } | null;
  competition_sector: { id: string; sector_type: SectorType; name: string; requires_medical_approval: boolean } | null;
  practice_approval: ApprovalRecord | null;
  competition_approval: ApprovalRecord | null;
  practice_status: ApprovalState;
  competition_status: ApprovalState;
  needs_attention: boolean;
  has_blocking_issue: boolean;
  has_expiring_soon: boolean;
  has_valid_coverage: boolean;
};

type DashboardSummary = {
  total_players: number;
  missing_or_blocked: number;
  expiring_soon: number;
  covered_now: number;
};

type MedicalApprovalsClientProps = {
  rows: DashboardRow[];
  summary: DashboardSummary;
};

function getStatusLabel(status: ApprovalState) {
  switch (status) {
    case 'valid':
      return 'Valid';
    case 'expiring_soon':
      return 'Less than 2 months left';
    case 'missing':
      return 'Missing';
    case 'expired':
      return 'Expired';
    case 'revoked':
      return 'Revoked';
    case 'not_required':
      return 'Not required';
    default:
      return status;
  }
}

function getStatusClass(status: ApprovalState) {
  switch (status) {
    case 'valid':
      return styles.statusValid;
    case 'expiring_soon':
      return styles.statusSoon;
    case 'missing':
    case 'expired':
    case 'revoked':
      return styles.statusMissing;
    case 'not_required':
    default:
      return styles.statusNeutral;
  }
}

function matchesFilter(row: DashboardRow, filter: string) {
  if (filter === 'all') return true;
  if (filter === 'missing') return row.has_blocking_issue;
  if (filter === 'expiring_soon') return row.has_expiring_soon;
  if (filter === 'covered') return row.has_valid_coverage && !row.has_blocking_issue && !row.has_expiring_soon;
  return true;
}

export function MedicalApprovalsClient({ rows, summary }: MedicalApprovalsClientProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'covered' | 'missing' | 'expiring_soon'>('all');
  const [sportFilter, setSportFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedRow, setSelectedRow] = useState<DashboardRow | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sports = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach(row => map.set(row.sport_id, row.sport_name));
    return [...map.entries()].map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter(row => {
      const textMatch =
        !term ||
        row.full_name.toLowerCase().includes(term) ||
        (row.national_id ?? '').toLowerCase().includes(term);

      const sportMatch = !sportFilter || row.sport_id === sportFilter;
      const statusMatch = matchesFilter(row, statusFilter);

      return textMatch && sportMatch && statusMatch;
    });
  }, [rows, search, sportFilter, statusFilter]);

  const handleAddApproval = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRow) return;

    const form = event.currentTarget;
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(form);
    formData.append('personId', selectedRow.person_id);

    const result = await addMedicalApprovalFromDashboard(formData);

    if (!result.success) {
      setError(result.error || 'Unable to save the medical approval.');
      setIsSubmitting(false);
      return;
    }

    form.reset();
    setIsSubmitting(false);
    router.refresh();
  };

  return (
    <div className={styles.pageStack} dir="rtl">
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{summary.total_players}</div>
          <div className={styles.summaryLabel}>Registered players</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{summary.covered_now}</div>
          <div className={styles.summaryLabel}>Fully covered now</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{summary.expiring_soon}</div>
          <div className={styles.summaryLabel}>Expiry within 2 months</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryValue}>{summary.missing_or_blocked}</div>
          <div className={styles.summaryLabel}>Missing or blocked</div>
        </div>
      </div>

      {error ? <div className={styles.error}>{error}</div> : null}

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <div className={styles.field}>
            <label className={styles.label}>Search by player or national ID</label>
            <input
              className={styles.input}
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search..."
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Sport</label>
            <select className={styles.select} value={sportFilter} onChange={event => setSportFilter(event.target.value)}>
              <option value="">All sports</option>
              {sports.map(sport => (
                <option key={sport.id} value={sport.id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Medical state</label>
            <select
              className={styles.select}
              value={statusFilter}
              onChange={event => setStatusFilter(event.target.value as 'all' | 'covered' | 'missing' | 'expiring_soon')}
            >
              <option value="all">All players</option>
              <option value="covered">Covered now</option>
              <option value="missing">Missing or blocked</option>
              <option value="expiring_soon">Expiring soon</option>
            </select>
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Sport</th>
              <th>Level</th>
              <th>Practice approval</th>
              <th>Competition approval</th>
              <th>Attention</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(row => (
              <tr key={row.id}>
                <td>
                  <div className={styles.playerName}>{row.full_name}</div>
                  <div className={styles.playerMeta}>{row.national_id || 'No national ID'}</div>
                </td>
                <td>
                  <div className={styles.playerName}>{row.sport_name}</div>
                  <div className={styles.playerMeta}>Player status: {row.player_status}</div>
                </td>
                <td>{row.level_name || '-'}</td>
                <td>
                  <div className={styles.badgeStack}>
                    <span className={`${styles.statusBadge} ${getStatusClass(row.practice_status)}`}>
                      {getStatusLabel(row.practice_status)}
                    </span>
                    {row.practice_approval ? (
                      <div className={styles.approvalMeta}>
                        <span>Issue: {row.practice_approval.issue_date}</span>
                        <span>Expiry: {row.practice_approval.expiry_date}</span>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td>
                  <div className={styles.badgeStack}>
                    <span className={`${styles.statusBadge} ${getStatusClass(row.competition_status)}`}>
                      {getStatusLabel(row.competition_status)}
                    </span>
                    {row.competition_approval ? (
                      <div className={styles.approvalMeta}>
                        <span>Issue: {row.competition_approval.issue_date}</span>
                        <span>Expiry: {row.competition_approval.expiry_date}</span>
                      </div>
                    ) : null}
                  </div>
                </td>
                <td>
                  <span className={`${styles.attentionBadge} ${row.needs_attention ? styles.attentionYes : styles.attentionNo}`}>
                    {row.needs_attention ? 'Needs follow-up' : 'OK'}
                  </span>
                </td>
                <td>
                  <button type="button" className={styles.secondaryButton} onClick={() => { setSelectedRow(row); setError(''); }}>
                    Record approval
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No players match the current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {selectedRow ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2 className={styles.panelTitle}>Medical approval for {selectedRow.full_name}</h2>
              <p className={styles.panelDescription}>
                Use this form to register a fresh medical approval for practice or competition. The page will refresh and update the monitoring status immediately.
              </p>
            </div>
            <button type="button" className={styles.secondaryButton} onClick={() => setSelectedRow(null)}>
              Close
            </button>
          </div>

          <form onSubmit={handleAddApproval}>
            <div className={styles.formGrid}>
              <div className={styles.field}>
                <label className={styles.label}>Sector</label>
                <select name="sectorType" className={styles.select} required disabled={isSubmitting}>
                  <option value="practice">Practice</option>
                  <option value="competition">Competition</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Issue date</label>
                <input type="date" name="issueDate" className={styles.input} required disabled={isSubmitting} />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Validity in months</label>
                <input
                  type="number"
                  name="validityMonths"
                  className={styles.input}
                  defaultValue="6"
                  min="1"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className={styles.fullField}>
                <label className={styles.label}>Notes</label>
                <textarea name="notes" className={styles.textarea} disabled={isSubmitting} />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setSelectedRow(null)}>
                Cancel
              </button>
              <button type="submit" className={styles.actionButton} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save medical approval'}
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}

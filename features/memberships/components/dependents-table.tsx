import styles from './memberships-table.module.css';

interface DependentRecord {
  id: string;
  relation_type: string;
  status: string;
  dependent_number: string;
  person: {
    id: string;
    first_name: string;
    second_name: string;
    third_name: string;
    last_name: string;
    national_id: string;
  };
}

interface DependentsTableProps {
  dependents: DependentRecord[];
}

const RELATION_ARABIC: Record<string, string> = {
  wife: 'زوجة',
  husband: 'زوج',
  son: 'ابن',
  daughter: 'ابنة',
  father: 'أب',
  mother: 'أم',
};

export function DependentsTable({ dependents }: DependentsTableProps) {
  if (!dependents || dependents.length === 0) {
    return (
      <div className={styles.tableContainer} dir="rtl">
        <div className={styles.emptyState}>
          لا يوجد تابعين مسجلين لهذه العضوية (No dependents found)
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer} dir="rtl">
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>رقم العضوية (Number)</th>
            <th className={styles.th}>الاسم (Name)</th>
            <th className={styles.th}>صلة القرابة (Relation)</th>
            <th className={styles.th}>الرقم القومي (National ID)</th>
            <th className={styles.th}>الحالة (Status)</th>
          </tr>
        </thead>
        <tbody>
          {dependents.map((dep) => {
            const fullName = dep.person
              ? `${dep.person.first_name} ${dep.person.second_name} ${dep.person.third_name} ${dep.person.last_name}`
              : 'Unknown';

            const relationLabel = RELATION_ARABIC[dep.relation_type] || dep.relation_type;

            return (
              <tr key={dep.id} className={styles.tr}>
                <td className={styles.td} style={{ fontWeight: 600 }}>{dep.dependent_number}</td>
                <td className={styles.td}>{fullName}</td>
                <td className={styles.td}>{relationLabel}</td>
                <td className={styles.td} dir="ltr" style={{ textAlign: 'right' }}>{dep.person.national_id}</td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${dep.status !== 'active' ? styles.badgeArchived : ''}`}>
                    {dep.status === 'active' ? 'نشط' : dep.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

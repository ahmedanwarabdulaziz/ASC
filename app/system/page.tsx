export default function SystemDashboard() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">لوحة القيادة | Dashboard</h1>
      </div>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-value">1,200</div>
          <div className="stat-label">عضو نشط | Active Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">45</div>
          <div className="stat-label">دخول اليوم | Today's Entries</div>
        </div>
      </div>
    </div>
  );
}

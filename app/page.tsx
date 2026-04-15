import Link from 'next/link';

export default function Home() {
  return (
    <div className="landing-container">
      <div className="landing-content">
        <h1 className="logo-text">نادي أسيوط الرياضي</h1>
        <p className="subtitle">المنصة الرقمية المتكاملة لخدمة أعضاء النادي وإدارة العمليات</p>
        
        <div className="action-buttons">
          <Link href="/auth/login" className="btn btn-primary">
            دخول السيستم | Enter System
          </Link>
        </div>
      </div>
    </div>
  );
}

'use client';

import Navigation from '@/components/Navigation';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-blue-600 mb-4 text-center">
            لوحة التحكم
          </h1>
          <p className="text-gray-600 text-center">
            مرحباً بك في لوحة التحكم
          </p>
        </div>
      </main>
    </div>
  );
}

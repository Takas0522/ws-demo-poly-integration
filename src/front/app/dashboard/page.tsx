'use client';

import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layouts/MainLayout';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">ダッシュボード</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            ようこそ、{user?.user_id} さん
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700">テナントID: {user?.tenant_id}</p>
            <p className="text-gray-700 font-semibold">ロール:</p>
            <ul className="list-disc list-inside ml-4 text-gray-600">
              {user?.roles.map((role, index) => (
                <li key={index}>
                  {role.service_name}: {role.role_name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

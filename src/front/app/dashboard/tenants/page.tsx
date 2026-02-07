'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface Tenant {
  tenant_id: string;
  tenant_name: string;
  is_privileged: boolean;
  created_at: string;
  updated_at: string;
}

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tenants');
      
      if (!response.ok) {
        throw new Error('テナントの取得に失敗しました');
      }
      
      const data = await response.json();
      setTenants(data.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tenantId: string, isPrivileged: boolean) => {
    if (isPrivileged) {
      alert('特権テナントは削除できません');
      return;
    }

    if (!confirm('このテナントを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('テナントの削除に失敗しました');
      }

      await fetchTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">テナント管理</h1>
          <Button onClick={() => router.push('/dashboard/tenants/new')}>
            新規テナント作成
          </Button>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  テナント名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  特権
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  作成日
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-600">
                    テナントがありません
                  </td>
                </tr>
              ) : (
                tenants.map((tenant) => (
                  <tr key={tenant.tenant_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tenant.tenant_name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {tenant.tenant_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tenant.is_privileged ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          特権
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          通常
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(tenant.created_at).toLocaleString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => router.push(`/dashboard/tenants/${tenant.tenant_id}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => handleDelete(tenant.tenant_id, tenant.is_privileged)}
                        className={`${
                          tenant.is_privileged
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        disabled={tenant.is_privileged}
                      >
                        削除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
}

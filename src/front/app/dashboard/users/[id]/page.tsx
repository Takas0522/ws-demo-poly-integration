'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

interface User {
  user_id: string;
  tenant_id: string;
  tenant_name?: string;
  created_at: string;
  updated_at: string;
  roles: Array<{
    service_id: string;
    service_name: string;
    role_code: string;
    role_name: string;
  }>;
}

interface Service {
  service_id: string;
  service_name: string;
  available_roles: Array<{
    role_code: string;
    role_name: string;
  }>;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [roleChanges, setRoleChanges] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadUser = async () => {
      await fetchUser();
      await fetchServices();
    };
    loadUser();
  }, [userId]); // fetchUserとfetchServicesではなくuserIdのみを依存配列に含める

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/${userId}`);
      
      if (!response.ok) {
        throw new Error('ユーザー情報の取得に失敗しました');
      }
      
      const data = await response.json();
      setUser(data);
      
      // Initialize role changes with current roles
      const currentRoles: Record<string, string> = {};
      data.roles?.forEach((role: { service_id: string; role_code: string }) => {
        currentRoles[role.service_id] = role.role_code;
      });
      setRoleChanges(currentRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const handleRoleChange = (serviceId: string, roleCode: string) => {
    setRoleChanges({
      ...roleChanges,
      [serviceId]: roleCode,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      
      const roles = Object.entries(roleChanges)
        .filter(([, roleCode]) => roleCode !== '')
        .map(([serviceId, roleCode]) => ({
          service_id: serviceId,
          role_code: roleCode,
        }));

      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'ロールの更新に失敗しました');
      }

      setSuccess('ロール情報を更新しました');
      setIsEditing(false);
      await fetchUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
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

  if (!user) {
    return (
      <MainLayout>
        <Alert type="error" message="ユーザーが見つかりません" />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900">ユーザー詳細</h1>
          </div>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              ロール編集
            </Button>
          )}
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}
        
        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        <div className="bg-white shadow-md rounded-lg p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">ユーザーID</label>
              <p className="mt-1 text-sm text-gray-900">{user.user_id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">テナント</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.tenant_name || user.tenant_id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">作成日時</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleString('ja-JP')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600">更新日時</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.updated_at).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>

          <hr />

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">ロール設定</h2>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {services.map((service) => (
                  <div key={service.service_id} className="border border-gray-200 rounded-md p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {service.service_name}
                    </label>
                    <select
                      value={roleChanges[service.service_id] || ''}
                      onChange={(e) => handleRoleChange(service.service_id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">なし</option>
                      {service.available_roles?.map((role) => (
                        <option key={role.role_code} value={role.role_code}>
                          {role.role_name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}

                <div className="flex justify-end space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsEditing(false);
                      // Reset changes
                      const currentRoles: Record<string, string> = {};
                      user.roles?.forEach((role) => {
                        currentRoles[role.service_id] = role.role_code;
                      });
                      setRoleChanges(currentRoles);
                      setError(null);
                    }}
                    disabled={saving}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit" loading={saving}>
                    保存
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((role, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <span className="text-sm font-medium text-gray-900">
                        {role.service_name}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {role.role_name}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">ロールが割り当てられていません</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

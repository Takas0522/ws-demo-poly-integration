'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface Tenant {
  tenant_id: string;
  tenant_name: string;
}

interface Service {
  service_id: string;
  service_name: string;
  available_roles: Array<{
    role_code: string;
    role_name: string;
  }>;
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    user_id: '',
    password: '',
    tenant_id: '',
    roles: [] as Array<{
      service_id: string;
      role_code: string;
    }>,
  });

  useEffect(() => {
    fetchTenants();
    fetchServices();
  }, []);

  const fetchTenants = async () => {
    try {
      const response = await fetch('/api/tenants');
      if (response.ok) {
        const data = await response.json();
        setTenants(data.tenants || []);
      }
    } catch (err) {
      console.error('Failed to fetch tenants:', err);
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
    const existingRoleIndex = formData.roles.findIndex(r => r.service_id === serviceId);
    
    if (existingRoleIndex >= 0) {
      // Update existing role
      const newRoles = [...formData.roles];
      if (roleCode) {
        newRoles[existingRoleIndex] = { service_id: serviceId, role_code: roleCode };
      } else {
        // Remove role if empty
        newRoles.splice(existingRoleIndex, 1);
      }
      setFormData({ ...formData, roles: newRoles });
    } else if (roleCode) {
      // Add new role
      setFormData({
        ...formData,
        roles: [...formData.roles, { service_id: serviceId, role_code: roleCode }],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.user_id.trim() || !formData.password.trim() || !formData.tenant_id) {
      setError('すべての必須項目を入力してください');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'ユーザーの作成に失敗しました');
      }

      router.push('/dashboard/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900"
          >
            ← 戻る
          </button>
          <h1 className="text-3xl font-bold text-gray-900">新規ユーザー作成</h1>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="user_id" className="block text-sm font-medium text-gray-700 mb-2">
                ユーザーID <span className="text-red-700">*</span>
              </label>
              <Input
                id="user_id"
                type="text"
                value={formData.user_id}
                onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                placeholder="例: user001"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                パスワード <span className="text-red-700">*</span>
              </label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="パスワード"
                required
              />
            </div>

            <div>
              <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700 mb-2">
                テナント <span className="text-red-700">*</span>
              </label>
              <select
                id="tenant_id"
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">選択してください</option>
                {tenants.map((tenant) => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ロール割り当て
              </label>
              <div className="space-y-3">
                {services.map((service) => (
                  <div key={service.service_id} className="border border-gray-200 rounded-md p-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {service.service_name}
                    </label>
                    <select
                      value={formData.roles.find(r => r.service_id === service.service_id)?.role_code || ''}
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
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
              <Button type="submit" loading={loading}>
                作成
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layouts/MainLayout';
import { Alert } from '@/components/ui/Alert';

interface Service {
  service_id: string;
  service_name: string;
  description?: string;
  created_at: string;
  available_roles: Array<{
    role_code: string;
    role_name: string;
  }>;
}

interface Tenant {
  tenant_id: string;
  tenant_name: string;
}

interface TenantService {
  service_id: string;
  service_name: string;
  assigned_at: string;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [tenantServices, setTenantServices] = useState<TenantService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchServices();
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantServices(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/services');
      
      if (!response.ok) {
        throw new Error('サービスの取得に失敗しました');
      }
      
      const data = await response.json();
      setServices(data.services || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

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

  const fetchTenantServices = async (tenantId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/services`);
      
      if (response.ok) {
        const data = await response.json();
        setTenantServices(data.services || []);
      }
    } catch (err) {
      console.error('Failed to fetch tenant services:', err);
      setTenantServices([]);
    }
  };

  const isServiceAssigned = (serviceId: string): boolean => {
    return tenantServices.some(ts => ts.service_id === serviceId);
  };

  const handleAssignService = async (serviceId: string) => {
    if (!selectedTenant) {
      setError('テナントを選択してください');
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${selectedTenant}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service_id: serviceId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'サービスの割り当てに失敗しました');
      }

      setSuccess('サービスを割り当てました');
      await fetchTenantServices(selectedTenant);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };

  const handleUnassignService = async (serviceId: string) => {
    if (!selectedTenant) {
      return;
    }

    if (!confirm('このサービスの割り当てを解除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/tenants/${selectedTenant}/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'サービスの割り当て解除に失敗しました');
      }

      setSuccess('サービスの割り当てを解除しました');
      await fetchTenantServices(selectedTenant);
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
          <h1 className="text-3xl font-bold text-gray-900">サービス設定</h1>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {success && (
          <Alert type="success" message={success} onClose={() => setSuccess(null)} />
        )}

        {/* Tenant Selector */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <label htmlFor="tenant_select" className="block text-sm font-medium text-gray-700 mb-2">
            テナントを選択
          </label>
          <select
            id="tenant_select"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">テナントを選択してください</option>
            {tenants.map((tenant) => (
              <option key={tenant.tenant_id} value={tenant.tenant_id}>
                {tenant.tenant_name}
              </option>
            ))}
          </select>
        </div>

        {/* Services List */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">利用可能なサービス</h2>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  サービス名
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  利用可能なロール
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    サービスがありません
                  </td>
                </tr>
              ) : (
                services.map((service) => {
                  const assigned = isServiceAssigned(service.service_id);
                  return (
                    <tr key={service.service_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {service.service_name}
                        </div>
                        {service.description && (
                          <div className="text-sm text-gray-500">
                            {service.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {service.available_roles?.map((role) => (
                            <span
                              key={role.role_code}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {role.role_name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {selectedTenant ? (
                          assigned ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              割り当て済み
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              未割り当て
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400">テナント未選択</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {selectedTenant && (
                          assigned ? (
                            <button
                              onClick={() => handleUnassignService(service.service_id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              割り当て解除
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAssignService(service.service_id)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              割り当て
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Assigned Services for Selected Tenant */}
        {selectedTenant && tenantServices.length > 0 && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <h2 className="text-lg font-semibold text-blue-900">
                割り当て済みサービス
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-2">
                {tenantServices.map((service) => (
                  <div
                    key={service.service_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                  >
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {service.service_name}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        割り当て日: {new Date(service.assigned_at).toLocaleString('ja-JP')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

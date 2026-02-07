"use client";

import { MainLayout } from "@/components/layouts/MainLayout";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Tenant {
  tenant_id: string;
  tenant_name: string;
  is_privileged: boolean;
  created_at: string;
  updated_at: string;
}

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    tenant_name: "",
  });

  useEffect(() => {
    const loadTenant = async () => {
      await fetchTenant();
    };
    loadTenant();
  }, [tenantId]); // fetchTenantではなくtenantIdのみを依存配列に含める

  const fetchTenant = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tenants/${tenantId}`);

      if (!response.ok) {
        throw new Error("テナント情報の取得に失敗しました");
      }

      const data = await response.json();
      setTenant(data);
      setFormData({ tenant_name: data.tenant_name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (tenant?.is_privileged) {
      setError("特権テナントは編集できません");
      return;
    }

    if (!formData.tenant_name.trim()) {
      setError("テナント名を入力してください");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/tenants/${tenantId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "テナントの更新に失敗しました");
      }

      setSuccess("テナント情報を更新しました");
      setIsEditing(false);
      await fetchTenant();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
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

  if (!tenant) {
    return (
      <MainLayout>
        <Alert type="error" message="テナントが見つかりません" />
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
            <h1 className="text-3xl font-bold text-gray-900">テナント詳細</h1>
          </div>
          {!isEditing && !tenant.is_privileged && (
            <Button onClick={() => setIsEditing(true)}>編集</Button>
          )}
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        <div className="bg-white shadow-md rounded-lg p-6">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="tenant_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  テナント名 <span className="text-red-700">*</span>
                </label>
                <Input
                  id="tenant_name"
                  type="text"
                  value={formData.tenant_name}
                  onChange={(e) =>
                    setFormData({ ...formData, tenant_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ tenant_name: tenant.tenant_name });
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  テナントID
                </label>
                <p className="mt-1 text-sm text-gray-900">{tenant.tenant_id}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  テナント名
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {tenant.tenant_name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  特権テナント
                </label>
                <p className="mt-1">
                  {tenant.is_privileged ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      特権
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      通常
                    </span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  作成日時
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(tenant.created_at).toLocaleString("ja-JP")}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  更新日時
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(tenant.updated_at).toLocaleString("ja-JP")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}

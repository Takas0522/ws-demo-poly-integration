"use client";

import { MainLayout } from "@/components/layouts/MainLayout";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function NewTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenant_name: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tenant_name.trim()) {
      setError("テナント名を入力してください");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/tenants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || "テナントの作成に失敗しました");
      }

      router.push("/dashboard/tenants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
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
          <h1 className="text-3xl font-bold text-gray-900">新規テナント作成</h1>
        </div>

        {error && (
          <Alert type="error" message={error} onClose={() => setError(null)} />
        )}

        <div className="bg-white shadow-md rounded-lg p-6">
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
                placeholder="例: サンプル企業"
                required
              />
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

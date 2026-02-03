'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';

interface LoginFormData {
  user_id: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'ログインに失敗しました');
      }

      // ログイン成功 - ダッシュボードにリダイレクト
      router.push('/dashboard');
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
      
      <div className="space-y-4">
        <Input
          label="ユーザーID"
          type="email"
          placeholder="user@example.com"
          error={errors.user_id?.message}
          {...register('user_id', {
            required: 'ユーザーIDを入力してください',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: '有効なメールアドレスを入力してください',
            },
          })}
        />

        <Input
          label="パスワード"
          type="password"
          placeholder="パスワード"
          error={errors.password?.message}
          {...register('password', {
            required: 'パスワードを入力してください',
            minLength: {
              value: 8,
              message: 'パスワードは8文字以上である必要があります',
            },
          })}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={loading}
      >
        ログイン
      </Button>

      <div className="text-sm text-gray-600 mt-4 p-4 bg-gray-50 rounded-md">
        <p className="font-semibold mb-2">デモ用アカウント:</p>
        <p>ID: admin@system.local</p>
        <p>パスワード: Admin@12345</p>
      </div>
    </form>
  );
}

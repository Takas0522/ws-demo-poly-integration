# タスク: Frontend - BFF基盤

## 概要
Next.js 14を使用したフロントエンドアプリケーションのBFF (Backend for Frontend) 基盤を構築します。認証Middleware、APIルーティング、共通コンポーネントなどの基礎機能を実装します。

## 対象コンポーネント
- Frontend (`/src/front`)

## 前提条件
- タスク03 (認証認可サービス - コアAPI) が完了
- Node.js 20、npm が利用可能

## 実装内容

### 1. プロジェクト構造作成

```
src/front/
├── app/
│   ├── (auth)/                   # 認証関連ページ（レイアウト分離）
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/              # ダッシュボード（認証必須）
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── api/                      # BFF API Routes
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.ts
│   │   │   ├── logout/
│   │   │   │   └── route.ts
│   │   │   └── me/
│   │   │       └── route.ts
│   │   ├── tenants/
│   │   │   └── route.ts
│   │   ├── users/
│   │   │   └── route.ts
│   │   └── services/
│   │       └── route.ts
│   ├── layout.tsx                # ルートレイアウト
│   ├── page.tsx                  # トップページ
│   └── globals.css
├── components/
│   ├── ui/                       # 汎用UIコンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Table.tsx
│   │   ├── Modal.tsx
│   │   └── Loading.tsx
│   ├── forms/                    # フォームコンポーネント
│   │   ├── LoginForm.tsx
│   │   └── FormField.tsx
│   └── layouts/                  # レイアウトコンポーネント
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── DashboardLayout.tsx
├── lib/
│   ├── api-client.ts             # BFF APIクライアント
│   ├── auth.ts                   # 認証ヘルパー
│   ├── types.ts                  # TypeScript型定義
│   ├── utils.ts                  # ユーティリティ
│   └── constants.ts
├── hooks/
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useToast.ts
├── middleware.ts                 # Next.js Middleware
├── .env.example
├── .env.local
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### 2. プロジェクト初期設定

#### 2.1 Next.js プロジェクト作成
```bash
npx create-next-app@latest front \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

#### 2.2 必要パッケージのインストール
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "axios": "^1.6.0",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.3.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    "prettier": "^3.0.0"
  }
}
```

### 3. 認証Middleware実装

#### 3.1 middleware.ts
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // 認証不要ページ
  if (pathname.startsWith('/login')) {
    // トークンがある場合はダッシュボードへリダイレクト
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // 保護されたページ
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 4. BFF API Routes実装

#### 4.1 認証API (`app/api/auth/login/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // バックエンド認証サービスへリクエスト
    const response = await fetch(`${process.env.AUTH_SERVICE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const data = await response.json();

    // JWTをHTTPOnly Cookieに保存
    cookies().set('auth_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: data.expires_in,
      path: '/',
    });

    // クライアントにはトークンを返さない（セキュアのため）
    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 4.2 ログアウトAPI (`app/api/auth/logout/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // Cookieを削除
  cookies().delete('auth_token');
  
  return NextResponse.json({ success: true });
}
```

#### 4.3 現在のユーザー取得API (`app/api/auth/me/route.ts`)
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('auth_token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // バックエンドで検証
  const response = await fetch(`${process.env.AUTH_SERVICE_URL}/api/v1/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const user = await response.json();
  return NextResponse.json(user);
}
```

### 5. APIクライアント実装

#### 5.1 lib/api-client.ts
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Cookieを含める
    });

    // レスポンスインターセプター
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 認証エラーの場合はログインページへ
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new APIClient();
```

### 6. 認証フック実装

#### 6.1 hooks/useAuth.ts
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface User {
  id: string;
  username: string;
  display_name: string;
  tenant_id: string;
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.post<{ success: boolean; user: User }>(
        '/auth/login',
        { username, password }
      );
      
      if (response.success) {
        router.push('/dashboard');
        return response.user;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    
    try {
      await apiClient.post('/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    loading,
    error,
  };
}
```

### 7. 共通UIコンポーネント実装

#### 7.1 Button.tsx
```typescript
import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  children, 
  loading, 
  disabled,
  ...props 
}: ButtonProps) {
  const baseClass = 'px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 disabled:opacity-50';
  
  const variantClass = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };

  return (
    <button
      className={`${baseClass} ${variantClass[variant]}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

#### 7.2 Input.tsx, Card.tsx, Loading.tsx など
基本的なUIコンポーネントを実装。

### 8. 環境設定

#### 8.1 .env.example
```
# Backend Services
AUTH_SERVICE_URL=http://localhost:8001
TENANT_SERVICE_URL=http://localhost:8002
SERVICE_SETTING_URL=http://localhost:8003

# JWT
JWT_SECRET_KEY=your-super-secret-key

# Next.js
NEXT_PUBLIC_APP_NAME=Management App
```

#### 8.2 next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      // 開発環境でのCORS回避用プロキシ（本番では不要）
      {
        source: '/api/backend/:path*',
        destination: process.env.AUTH_SERVICE_URL + '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
```

### 9. Tailwind CSS設定

#### 9.1 tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
        secondary: '#6B7280',
        danger: '#EF4444',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 10. テスト設定

#### 10.1 Jest設定
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom
```

#### 10.2 jest.config.js
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};

module.exports = createJestConfig(customJestConfig);
```

## 完了条件

- [ ] Next.js プロジェクトが作成される
- [ ] 認証Middlewareが動作する
- [ ] BFF API Routesが実装される:
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/logout
  - [ ] GET /api/auth/me
- [ ] APIクライアントが実装される
- [ ] useAuth フックが動作する
- [ ] 共通UIコンポーネントが実装される:
  - [ ] Button
  - [ ] Input
  - [ ] Card
  - [ ] Loading
- [ ] Tailwind CSSが設定される
- [ ] TypeScript設定が完了
- [ ] ESLint, Prettierが設定される
- [ ] テスト環境が構築される
- [ ] ローカルで起動できる (`npm run dev`)
- [ ] README.mdが作成される

## 依存タスク
- 03. 認証認可サービス - コアAPI

## 後続タスク
- 15. Frontend - 認証画面
- 16. Frontend - テナント管理画面
- 17. Frontend - ユーザー管理画面
- 18. Frontend - サービス設定画面
- 19. Frontend - ダッシュボード

## 技術的考慮事項

### セキュリティ
- JWTはHTTPOnly Cookieで保存（XSS対策）
- sameSite=strict でCSRF対策
- 本番環境ではsecure=true必須

### パフォーマンス
- React QueryでAPIキャッシング
- 画像最適化（Next.js Image）
- コード分割

### ユーザビリティ
- ローディング状態の表示
- エラーハンドリング
- レスポンシブデザイン

## 参照ドキュメント
- [コンポーネント設計 - Frontend](../../arch/components/README.md#2-frontend-コンポーネント)
- [API設計 - BFF API](../../arch/api/README.md#7-bff-frontend-api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 見積もり工数
- セットアップ: 1日
- BFF API実装: 1日
- 共通コンポーネント: 1日
- テスト設定: 0.5日
- **合計**: 3.5日

## 備考
- 実際の画面実装は後続タスクで行う
- このタスクでは基盤のみを構築
- Phase 1では最小限のUIで実装、Phase 2でUI改善

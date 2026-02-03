# タスク07: BFF・認証基盤実装

## 概要

Next.js の BFF (Backend for Frontend) 機能を実装します。API Routes でバックエンドサービスへのプロキシ、JWT認証、Middleware による認証チェックを実装し、フロントエンドから安全にバックエンドサービスにアクセスできるようにします。

## 対象コンポーネント

- Next.js API Routes（BFF層）
- 認証Middleware
- APIクライアント
- セッション管理

## 前提条件

- タスク04（認証認可サービス実装）が完了していること
- Next.jsプロジェクトが作成されていること

## 実装内容

### 1. 環境変数設定

**`src/front/.env.local`**:
```bash
NEXT_PUBLIC_AUTH_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_TENANT_SERVICE_URL=http://localhost:8002
NEXT_PUBLIC_SERVICE_SETTING_URL=http://localhost:8003
JWT_SECRET=your-development-secret-key-change-in-production
NODE_ENV=development
```

### 2. APIクライアント

**`src/front/lib/api-client.ts`**:
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class APIClient {
  private authClient: AxiosInstance;
  private tenantClient: AxiosInstance;
  private serviceClient: AxiosInstance;

  constructor() {
    this.authClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_AUTH_SERVICE_URL,
      timeout: 10000,
    });

    this.tenantClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_TENANT_SERVICE_URL,
      timeout: 10000,
    });

    this.serviceClient = axios.create({
      baseURL: process.env.NEXT_PUBLIC_SERVICE_SETTING_URL,
      timeout: 10000,
    });
  }

  // 認証サービス
  async login(userId: string, password: string) {
    const response = await this.authClient.post('/api/v1/auth/login', {
      user_id: userId,
      password,
    });
    return response.data;
  }

  async verifyToken(token: string) {
    const response = await this.authClient.post('/api/v1/auth/verify', {
      token,
    });
    return response.data;
  }

  // テナントサービス
  async getTenants(token: string) {
    const response = await this.tenantClient.get('/api/v1/tenants', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async getTenant(tenantId: string, token: string) {
    const response = await this.tenantClient.get(`/api/v1/tenants/${tenantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  // サービス設定サービス
  async getServices(token: string) {
    const response = await this.serviceClient.get('/api/v1/services', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

export const apiClient = new APIClient();
```

### 3. 認証ユーティリティ

**`src/front/lib/auth.ts`**:
```typescript
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key'
);

export interface JWTPayload {
  user_id: string;
  tenant_id: string;
  roles: Array<{
    service_id: string;
    service_name: string;
    role_code: string;
    role_name: string;
  }>;
}

export async function createToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  
  return await verifyToken(token);
}

export function hasRole(user: JWTPayload, roleCodes: string[]): boolean {
  return user.roles.some(role => roleCodes.includes(role.role_code));
}
```

### 4. BFF API Routes - 認証

**`src/front/app/api/auth/login/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const { user_id, password } = await request.json();
    
    // 認証サービスでログイン
    const response = await apiClient.login(user_id, password);
    
    // Cookie に JWT を設定
    const cookieStore = cookies();
    cookieStore.set('auth_token', response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: response.expires_in,
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      user: response.user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.detail || 'Login failed' },
      { status: error.response?.status || 500 }
    );
  }
}
```

**`src/front/app/api/auth/logout/route.ts`**:
```typescript
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  cookieStore.delete('auth_token');
  
  return NextResponse.json({ success: true });
}
```

**`src/front/app/api/auth/me/route.ts`**:
```typescript
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  return NextResponse.json(session);
}
```

### 5. Middleware（認証チェック）

**`src/front/middleware.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// 認証不要なパス
const publicPaths = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 公開パスは認証不要
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // JWT トークン取得
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // トークン検証
  const payload = await verifyToken(token);
  
  if (!payload) {
    // トークンが無効な場合、ログイン画面にリダイレクト
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### 6. BFF API Routes - テナント管理

**`src/front/app/api/tenants/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const token = cookies().get('auth_token')?.value!;
    const tenants = await apiClient.getTenants(token);
    
    return NextResponse.json(tenants);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.response?.data?.detail || 'Failed to fetch tenants' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // ロールチェック: 管理者以上
  if (!hasRole(session, ['global_admin', 'admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // TODO: テナント作成処理
  
  return NextResponse.json({ success: true });
}
```

### 7. React Query セットアップ

**`src/front/lib/react-query-client.ts`**:
```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1分
      retry: 1,
    },
  },
});
```

**`src/front/app/providers.tsx`**:
```typescript
'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/react-query-client';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

### 8. ルートレイアウト更新

**`src/front/app/layout.tsx`**:
```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PoC管理アプリ',
  description: 'マルチテナント管理システム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 完了条件

- [ ] APIクライアントが実装されている
- [ ] 認証ユーティリティが実装されている
- [ ] BFF API Routes（認証）が実装されている
  - [ ] POST /api/auth/login
  - [ ] POST /api/auth/logout
  - [ ] GET /api/auth/me
- [ ] Middleware が実装され、認証チェックが動作する
- [ ] BFF API Routes（テナント）が実装されている
- [ ] React Query がセットアップされている
- [ ] ログインAPIを呼び出し、JWTがCookieに保存される
- [ ] 認証が必要なページにアクセスすると、未ログイン時にログイン画面にリダイレクトされる

## 依存タスク

- タスク04: 認証認可サービス実装

## 後続タスク

- タスク08: フロントエンド共通コンポーネント
- タスク13: モックサービス実装

## 参照ドキュメント

- [コンポーネント設計](../../arch/components/README.md)
- [API仕様](../../arch/api/api-specification.md)

## 注意事項

- JWT秘密鍵は環境変数で管理してください
- 本番環境では `secure: true` を設定してください
- CORS設定を適切に行ってください

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api-client';

export async function POST(request: NextRequest) {
  try {
    const { user_id, password } = await request.json();
    
    // 認証サービスでログイン
    const response = await apiClient.login(user_id, password);
    
    // Cookie に JWT を設定
    const cookieStore = await cookies();
    cookieStore.set('auth_token', response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: response.expires_in || 86400,
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      user: response.user,
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number }; message?: string };
    return NextResponse.json(
      { error: err.response?.data?.detail || err.message || 'Login failed' },
      { status: err.response?.status || 500 }
    );
  }
}

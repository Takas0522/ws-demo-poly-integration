import { NextRequest, NextResponse } from 'next/server';
import { getSession, hasRole } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    const tenants = await apiClient.getTenants(token);
    
    return NextResponse.json(tenants);
  } catch (error: unknown) {
    console.error('Get tenants error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to fetch tenants' },
      { status: err.response?.status || 500 }
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
  
  try {
    const data = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    const tenant = await apiClient.createTenant(data, token);
    
    return NextResponse.json(tenant, { status: 201 });
  } catch (error: unknown) {
    console.error('Create tenant error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to create tenant' },
      { status: err.response?.status || 500 }
    );
  }
}

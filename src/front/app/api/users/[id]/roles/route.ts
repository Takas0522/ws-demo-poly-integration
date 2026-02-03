import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const data = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    const result = await apiClient.updateUserRoles(id, data.roles, token);
    
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Update user roles error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to update user roles' },
      { status: err.response?.status || 500 }
    );
  }
}

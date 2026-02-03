import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    const tenant = await apiClient.getTenant(id, token);
    
    return NextResponse.json(tenant);
  } catch (error: unknown) {
    console.error('Get tenant error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to fetch tenant' },
      { status: err.response?.status || 500 }
    );
  }
}

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
    const tenant = await apiClient.updateTenant(id, data, token);
    
    return NextResponse.json(tenant);
  } catch (error: unknown) {
    console.error('Update tenant error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to update tenant' },
      { status: err.response?.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    await apiClient.deleteTenant(id, token);
    
    return NextResponse.json({ message: 'Tenant deleted successfully' });
  } catch (error: unknown) {
    console.error('Delete tenant error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to delete tenant' },
      { status: err.response?.status || 500 }
    );
  }
}

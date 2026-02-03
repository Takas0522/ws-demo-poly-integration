import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { cookies } from 'next/headers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id, serviceId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    await apiClient.unassignService(id, serviceId, token);
    
    return NextResponse.json({ message: 'Service unassigned successfully' });
  } catch (error: unknown) {
    console.error('Unassign service error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to unassign service' },
      { status: err.response?.status || 500 }
    );
  }
}

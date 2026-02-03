import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
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
    const users = await apiClient.getUsers(token);
    
    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error('Get users error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to fetch users' },
      { status: err.response?.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const data = await request.json();
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token found' }, { status: 401 });
    }
    const user = await apiClient.createUser(data, token);
    
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    console.error('Create user error:', error);
    const err = error as { response?: { data?: { detail?: string }; status?: number } };
    return NextResponse.json(
      { error: err.response?.data?.detail || 'Failed to create user' },
      { status: err.response?.status || 500 }
    );
  }
}

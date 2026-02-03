import { NextRequest, NextResponse } from 'next/server';

// モックバックアップデータ
const mockBackups = [
  {
    backup_id: 'backup-1',
    tenant_id: 'tenant-1',
    backup_type: 'full',
    status: 'completed',
    size_gb: 15.2,
    started_at: '2024-01-15T02:00:00Z',
    completed_at: '2024-01-15T02:45:00Z',
    duration_minutes: 45,
    files_count: 1250,
    retention_days: 30,
    expiry_date: '2024-02-14T02:45:00Z',
  },
  {
    backup_id: 'backup-2',
    tenant_id: 'tenant-1',
    backup_type: 'incremental',
    status: 'completed',
    size_gb: 2.8,
    started_at: '2024-01-14T02:00:00Z',
    completed_at: '2024-01-14T02:15:00Z',
    duration_minutes: 15,
    files_count: 320,
    retention_days: 30,
    expiry_date: '2024-02-13T02:15:00Z',
  },
  {
    backup_id: 'backup-3',
    tenant_id: 'tenant-1',
    backup_type: 'incremental',
    status: 'completed',
    size_gb: 1.5,
    started_at: '2024-01-13T02:00:00Z',
    completed_at: '2024-01-13T02:10:00Z',
    duration_minutes: 10,
    files_count: 180,
    retention_days: 30,
    expiry_date: '2024-02-12T02:10:00Z',
  },
  {
    backup_id: 'backup-4',
    tenant_id: 'tenant-1',
    backup_type: 'full',
    status: 'completed',
    size_gb: 14.8,
    started_at: '2024-01-08T02:00:00Z',
    completed_at: '2024-01-08T02:42:00Z',
    duration_minutes: 42,
    files_count: 1200,
    retention_days: 30,
    expiry_date: '2024-02-07T02:42:00Z',
  },
  {
    backup_id: 'backup-5',
    tenant_id: 'tenant-1',
    backup_type: 'failed',
    status: 'failed',
    size_gb: 0,
    started_at: '2024-01-07T02:00:00Z',
    completed_at: '2024-01-07T02:05:00Z',
    duration_minutes: 5,
    files_count: 0,
    retention_days: 30,
    error_message: 'ストレージ容量不足',
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const backupType = searchParams.get('backup_type');

    let filteredBackups = mockBackups;

    // ステータスでフィルタリング
    if (status) {
      filteredBackups = filteredBackups.filter(b => b.status === status);
    }

    // バックアップタイプでフィルタリング
    if (backupType) {
      filteredBackups = filteredBackups.filter(b => b.backup_type === backupType);
    }

    // ページネーション
    const paginatedBackups = filteredBackups.slice(offset, offset + limit);

    // 統計情報
    const stats = {
      total_backups: filteredBackups.length,
      completed_backups: filteredBackups.filter(b => b.status === 'completed').length,
      failed_backups: filteredBackups.filter(b => b.status === 'failed').length,
      total_size_gb: filteredBackups
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + b.size_gb, 0),
      last_backup: filteredBackups[0],
      next_scheduled_backup: '2024-01-16T02:00:00Z',
    };

    return NextResponse.json({
      backups: paginatedBackups,
      stats,
      total: filteredBackups.length,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'バックアップ一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // バリデーション
    if (!body.backup_type || !['full', 'incremental'].includes(body.backup_type)) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バックアップタイプは "full" または "incremental" を指定してください',
          },
        },
        { status: 400 }
      );
    }

    // 新しいバックアップジョブの作成（モック）
    const newBackup: {
      backup_id: string;
      tenant_id: string;
      backup_type: string;
      status: string;
      size_gb: number;
      started_at: string;
      completed_at: string | null;
      duration_minutes: number | null;
      files_count: number;
      retention_days: number;
      progress_percentage: number;
    } = {
      backup_id: `backup-${Date.now()}`,
      tenant_id: body.tenant_id || 'tenant-1',
      backup_type: body.backup_type,
      status: 'in_progress',
      size_gb: 0,
      started_at: new Date().toISOString(),
      completed_at: null,
      duration_minutes: null,
      files_count: 0,
      retention_days: body.retention_days || 30,
      progress_percentage: 0,
    };

    // バックアップ進行のシミュレーション
    setTimeout(() => {
      newBackup.status = 'completed';
      newBackup.completed_at = new Date(Date.now() + 30 * 60000).toISOString();
      newBackup.duration_minutes = 30;
      newBackup.size_gb = body.backup_type === 'full' ? 15.5 : 2.3;
      newBackup.files_count = body.backup_type === 'full' ? 1280 : 250;
      newBackup.progress_percentage = 100;
    }, 3000);

    return NextResponse.json(newBackup, { status: 202 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'バックアップの実行に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const backupId = searchParams.get('backup_id');

    if (!backupId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'バックアップIDは必須です',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'バックアップを削除しました',
      backup_id: backupId,
      deleted_at: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'バックアップの削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

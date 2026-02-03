import { NextRequest, NextResponse } from 'next/server';

// モックAPI利用状況データ
const mockApiUsage = {
  tenant_id: 'tenant-1',
  period: {
    start: '2024-01-01T00:00:00Z',
    end: '2024-01-31T23:59:59Z',
  },
  services: [
    {
      service_id: 'service-1',
      service_name: 'ファイル管理サービス',
      usage: {
        total_requests: 15420,
        successful_requests: 15350,
        failed_requests: 70,
        average_response_time_ms: 125,
      },
      endpoints: [
        {
          path: '/api/v1/files',
          method: 'GET',
          count: 8500,
          average_response_time_ms: 98,
        },
        {
          path: '/api/v1/files',
          method: 'POST',
          count: 3420,
          average_response_time_ms: 215,
        },
        {
          path: '/api/v1/files/{id}',
          method: 'DELETE',
          count: 3500,
          average_response_time_ms: 85,
        },
      ],
    },
    {
      service_id: 'service-2',
      service_name: 'メッセージングサービス',
      usage: {
        total_requests: 8760,
        successful_requests: 8720,
        failed_requests: 40,
        average_response_time_ms: 95,
      },
      endpoints: [
        {
          path: '/api/v1/messages',
          method: 'GET',
          count: 4200,
          average_response_time_ms: 75,
        },
        {
          path: '/api/v1/messages',
          method: 'POST',
          count: 4560,
          average_response_time_ms: 115,
        },
      ],
    },
  ],
  quotas: {
    monthly_requests_limit: 100000,
    monthly_requests_used: 24180,
    monthly_requests_remaining: 75820,
    storage_limit_gb: 100,
    storage_used_gb: 42.5,
    storage_remaining_gb: 57.5,
  },
  top_users: [
    {
      user_id: 'user001',
      requests: 5420,
      percentage: 22.4,
    },
    {
      user_id: 'user002',
      requests: 4150,
      percentage: 17.2,
    },
    {
      user_id: 'user003',
      requests: 3890,
      percentage: 16.1,
    },
  ],
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const serviceId = searchParams.get('service_id');

    const responseData = { ...mockApiUsage };

    // 期間フィルタリング（簡易実装）
    if (startDate && endDate) {
      responseData.period = {
        start: startDate,
        end: endDate,
      };
    }

    // サービスフィルタリング
    if (serviceId) {
      responseData.services = responseData.services.filter(
        s => s.service_id === serviceId
      );
    }

    return NextResponse.json(responseData);
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'API利用状況の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // レポート生成リクエスト（モック）
    const report: {
      report_id: string;
      status: string;
      requested_at: string;
      parameters: unknown;
      download_url: string | null;
    } = {
      report_id: `report-${Date.now()}`,
      status: 'processing',
      requested_at: new Date().toISOString(),
      parameters: body,
      download_url: null,
    };

    // 処理完了のシミュレーション
    setTimeout(() => {
      report.status = 'completed';
      report.download_url = `/api/mock/api-usage/reports/${report.report_id}/download`;
    }, 2000);

    return NextResponse.json(report, { status: 202 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'レポート生成に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

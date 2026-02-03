import { NextRequest, NextResponse } from 'next/server';

// モックメッセージデータ
const mockMessages = [
  {
    id: 'msg-1',
    subject: 'システムメンテナンスのお知らせ',
    body: '2024年1月20日 2:00-4:00にシステムメンテナンスを実施します。',
    from: 'system@example.com',
    to: 'all@example.com',
    status: 'delivered',
    created_at: '2024-01-15T10:00:00Z',
    read_at: null,
  },
  {
    id: 'msg-2',
    subject: '新機能リリースのご案内',
    body: '本日、新しい機能をリリースしました。詳細はドキュメントをご確認ください。',
    from: 'info@example.com',
    to: 'all@example.com',
    status: 'delivered',
    created_at: '2024-01-14T09:00:00Z',
    read_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'msg-3',
    subject: 'セキュリティアップデート',
    body: 'セキュリティアップデートを適用しました。パスワードの変更を推奨します。',
    from: 'security@example.com',
    to: 'all@example.com',
    status: 'delivered',
    created_at: '2024-01-13T08:00:00Z',
    read_at: '2024-01-13T08:30:00Z',
  },
  {
    id: 'msg-4',
    subject: 'ユーザー登録完了',
    body: 'ユーザー登録が完了しました。ログイン情報をご確認ください。',
    from: 'noreply@example.com',
    to: 'user001@example.com',
    status: 'delivered',
    created_at: '2024-01-12T07:00:00Z',
    read_at: '2024-01-12T07:15:00Z',
  },
  {
    id: 'msg-5',
    subject: 'パスワード変更のお知らせ',
    body: 'パスワードが正常に変更されました。',
    from: 'noreply@example.com',
    to: 'user002@example.com',
    status: 'delivered',
    created_at: '2024-01-11T06:00:00Z',
    read_at: null,
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    let filteredMessages = mockMessages;

    // ステータスでフィルタリング
    if (status) {
      filteredMessages = mockMessages.filter(msg => msg.status === status);
    }

    // ページネーション
    const paginatedMessages = filteredMessages.slice(offset, offset + limit);

    return NextResponse.json({
      messages: paginatedMessages,
      total: filteredMessages.length,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'メッセージ一覧の取得に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 簡易的なバリデーション
    if (!body.subject || !body.body || !body.to) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: '件名、本文、宛先は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 新しいメッセージの作成（モック）
    const newMessage: {
      id: string;
      subject: string;
      body: string;
      from: string;
      to: string;
      status: string;
      created_at: string;
      read_at: string | null;
    } = {
      id: `msg-${Date.now()}`,
      subject: body.subject,
      body: body.body,
      from: body.from || 'current_user@example.com',
      to: body.to,
      status: 'pending',
      created_at: new Date().toISOString(),
      read_at: null,
    };

    // 送信処理のシミュレーション
    setTimeout(() => {
      newMessage.status = 'delivered';
    }, 1000);

    return NextResponse.json(newMessage, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'メッセージの送信に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { message_id, action } = body;

    if (!message_id || !action) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'メッセージIDとアクションは必須です',
          },
        },
        { status: 400 }
      );
    }

    // メッセージの更新（モック）
    if (action === 'mark_as_read') {
      return NextResponse.json({
        message: 'メッセージを既読にしました',
        message_id,
        read_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      message: 'メッセージを更新しました',
      message_id,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'メッセージの更新に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

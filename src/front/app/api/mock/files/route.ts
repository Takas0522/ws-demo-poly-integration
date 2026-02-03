import { NextRequest, NextResponse } from 'next/server';

// モックファイルデータ
const mockFiles = [
  {
    id: 'file-1',
    name: 'document.pdf',
    size: 1024000,
    type: 'application/pdf',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    owner: 'user001',
  },
  {
    id: 'file-2',
    name: 'presentation.pptx',
    size: 2048000,
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    created_at: '2024-01-14T09:00:00Z',
    updated_at: '2024-01-14T09:00:00Z',
    owner: 'user002',
  },
  {
    id: 'file-3',
    name: 'spreadsheet.xlsx',
    size: 512000,
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    created_at: '2024-01-13T08:00:00Z',
    updated_at: '2024-01-13T08:00:00Z',
    owner: 'user001',
  },
  {
    id: 'file-4',
    name: 'image.png',
    size: 256000,
    type: 'image/png',
    created_at: '2024-01-12T07:00:00Z',
    updated_at: '2024-01-12T07:00:00Z',
    owner: 'user003',
  },
  {
    id: 'file-5',
    name: 'contract.docx',
    size: 768000,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    created_at: '2024-01-11T06:00:00Z',
    updated_at: '2024-01-11T06:00:00Z',
    owner: 'user002',
  },
];

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータの取得
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ページネーション
    const paginatedFiles = mockFiles.slice(offset, offset + limit);

    return NextResponse.json({
      files: paginatedFiles,
      total: mockFiles.length,
      limit,
      offset,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ファイル一覧の取得に失敗しました',
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
    if (!body.name) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ファイル名は必須です',
          },
        },
        { status: 400 }
      );
    }

    // 新しいファイルの作成（モック）
    const newFile = {
      id: `file-${Date.now()}`,
      name: body.name,
      size: body.size || 0,
      type: body.type || 'application/octet-stream',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      owner: 'current_user',
    };

    return NextResponse.json(newFile, { status: 201 });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ファイルのアップロードに失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'ファイルIDは必須です',
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: 'ファイルを削除しました',
      file_id: fileId,
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'ファイルの削除に失敗しました',
        },
      },
      { status: 500 }
    );
  }
}

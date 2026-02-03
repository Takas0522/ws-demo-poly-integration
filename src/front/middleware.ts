import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

// 認証不要なパス
const publicPaths = ['/login', '/api/auth/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 静的ファイルとNext.js内部パスはスキップ
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }
  
  // ログインページは認証済みの場合ダッシュボードにリダイレクト
  if (pathname === '/login') {
    const token = request.cookies.get('auth_token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }
  
  // ルートパスはログイン画面にリダイレクト
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // 公開パスは認証不要
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // JWT トークン取得
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // トークン検証
  const payload = await verifyToken(token);
  
  if (!payload) {
    // トークンが無効な場合、ログイン画面にリダイレクト
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

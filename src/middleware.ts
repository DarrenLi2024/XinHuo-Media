import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

const PUBLIC_STATIC = [
  '/_next',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_STATIC.some((p) => pathname.startsWith(p))) return true;
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return true;
  if (pathname === '/' || pathname === '/login') return true;
  return false;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Cookie-bearer token check for API routes and dashboard pages
  const hasToken = request.cookies.get('xh_access_token')?.value
    || request.headers.get('authorization')?.startsWith('Bearer ')
    || request.headers.get('x-session');

  if (!hasToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico).*)'],
};

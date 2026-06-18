import { NextRequest, NextResponse } from 'next/server';

// Public API paths that don't require authentication
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

// Static asset prefixes that should be excluded from middleware
const STATIC_PREFIXES = ['/_next/', '/favicon', '/robots.txt', '/sitemap.xml'];

function isStaticAsset(pathname: string): boolean {
  return STATIC_PREFIXES.some((p) => pathname.startsWith(p));
}

function isPublicPath(pathname: string): boolean {
  // Root redirects to login via page.tsx
  if (pathname === '/') return true;
  // Login page is always public
  if (pathname === '/login') return true;
  // Public API endpoints
  if (PUBLIC_API_PATHS.some((p) => pathname === p)) return true;
  return false;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Don't process static assets
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // Allow public paths through
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Authentication check for all other routes
  const hasToken =
    request.cookies.get('xh_access_token')?.value ||
    request.headers.get('authorization')?.startsWith('Bearer ') ||
    request.headers.get('x-session');

  if (!hasToken) {
    // API routes return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '请先登录' }, { status: 401 });
    }
    // Page routes redirect to login
    const loginUrl = new URL('/login', request.url);
    // Preserve the original destination so we can redirect back after login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — add security headers
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon (favicon file)
     * But include /api/* and all page routes
     */
    '/((?!_next/static|_next/image|favicon).*)',
  ],
};

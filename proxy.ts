import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/auth/session';

// Routes that require a logged-in user (any role)
const protectedRoutes = ['/my-courses', '/course'];

// Routes that require CREATOR role
const creatorRoutes = ['/creator-studio'];

// Routes that redirect to home if already logged in
const authRoutes = ['/login', '/signup'];

// API routes that require CREATOR role
const creatorApiRoutes = ['/api/creator'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from cookie
  const token = request.cookies.get('session')?.value;
  const session = await decrypt(token);

  // ─── Creator API protection ──────────────────────────────────────────────
  if (creatorApiRoutes.some(r => pathname.startsWith(r))) {
    if (!session || session.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // ─── Creator Studio protection ───────────────────────────────────────────
  if (creatorRoutes.some(r => pathname.startsWith(r))) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (session.role !== 'CREATOR') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // ─── Protected routes (any logged-in user) ───────────────────────────────
  if (protectedRoutes.some(r => pathname.startsWith(r))) {
    // /course/[id]/learn requires auth; /course/[id] is public
    const needsAuth = pathname.includes('/learn');
    if (needsAuth && !session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (pathname.startsWith('/my-courses') && !session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // ─── Redirect authenticated users away from auth pages ───────────────────
  if (authRoutes.some(r => pathname === r) && session) {
    return NextResponse.redirect(new URL(session.role === 'CREATOR' ? '/creator-studio' : '/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/uploadthing).*)',
  ],
};

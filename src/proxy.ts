import { NextResponse, type NextRequest } from 'next/server';

// Optimistic check only: no session cookie → straight to /login, without rendering anything.
// The real check (is this session valid, is the staff member still active, what role?) happens
// in requireStaff()/requireOwner() on the server, because a cookie can exist and still be expired.

const SESSION_COOKIE = 'rj_session';

export function proxy(request: NextRequest) {
  if (!request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Everything except the login page, Next internals and static files.
  matcher: ['/((?!login|_next/static|_next/image|icon\\.jpeg|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};

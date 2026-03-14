import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('token')
  const isLoginPage    = request.nextUrl.pathname === '/login'
  const isRegisterPage = request.nextUrl.pathname === '/register'

  // Si no hay token y no está en login/register → manda al login
  if (!token && !isLoginPage && !isRegisterPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay token y está en login → manda al dashboard
  if (token && (isLoginPage || isRegisterPage)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token");
  const pathname = request.nextUrl.pathname;

  const publicRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/subscription-required",
    "/superadmin/login",
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Sin token y en ruta protegida → login correspondiente
  if (!token && !isPublicRoute) {
    const dest = pathname.startsWith("/superadmin") ? "/superadmin/login" : "/login";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Con token y en ruta pública → destino correspondiente
  if (token && isPublicRoute) {
    const dest = pathname.startsWith("/superadmin") ? "/superadmin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manual-usuario.html).*)"],
};

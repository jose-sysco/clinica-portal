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
  ];

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Sin token y en ruta protegida → login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Con token y en ruta pública → dashboard (la propia página decidirá si va a /superadmin)
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

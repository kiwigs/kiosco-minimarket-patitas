// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas del panel
  const isPanelRoute = pathname === "/panel" || pathname.startsWith("/panel/");
  const isLoginPage = pathname === "/panel/login";

  if (isPanelRoute && !isLoginPage) {
    const authCookie = req.cookies.get("caja_auth")?.value;

    if (authCookie !== "1") {
      const loginUrl = new URL("/panel/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/panel/:path*", "/panel"],
};
